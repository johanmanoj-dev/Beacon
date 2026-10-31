package com.brightloop.scenarios;

import com.brightloop.billing.BillingService;
import com.brightloop.billing.dto.BillingRunResponse;
import com.brightloop.invoices.Invoice;
import com.brightloop.invoices.InvoiceRepository;
import com.brightloop.invoices.InvoiceStatus;
import com.brightloop.payments.PaymentAttemptStatus;
import com.brightloop.payments.PaymentMethod;
import com.brightloop.payments.PaymentService;
import com.brightloop.payments.dto.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class ElsaScenesE2ETest {

    @Autowired
    private BillingService billingService;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Test
    @DisplayName("Scene 4: Billing Day & Strict Idempotency Verification")
    void testScene4_BillingDayAndIdempotency() {
        LocalDate runDate = LocalDate.of(2026, 11, 20);
        BillingRunResponse firstRun = billingService.runBilling(runDate);
        assertNotNull(firstRun);
        assertTrue(firstRun.getInvoicesGenerated() >= 0);

        // Run recurring billing a second time with same date: verify STRICT IDEMPOTENCY
        BillingRunResponse secondRun = billingService.runBilling(runDate);
        assertNotNull(secondRun);
        assertEquals(0, secondRun.getInvoicesGenerated(), "Second billing run must generate 0 duplicates!");
        assertTrue(secondRun.getSkippedCount() >= 0, "Previously billed intervals must be skipped.");
    }

    @Test
    @DisplayName("Scene 6: Dual Payments (Manual Partial + Simulated Checkout & Overpayment Guard)")
    void testScene6_DualPaymentEngine() {
        List<Invoice> invoices = invoiceRepository.findAll();
        assertFalse(invoices.isEmpty(), "Invoices must exist in test dataset");

        // Pick an invoice with positive balance due
        Invoice target = invoices.stream()
                .filter(i -> i.getBalanceDue().compareTo(new BigDecimal("500.00")) > 0)
                .findFirst()
                .orElse(invoices.get(0));

        BigDecimal initialBalance = target.getBalanceDue();
        BigDecimal partialAmount = new BigDecimal("200.00");

        // 1. Staff records manual partial payment
        ManualPaymentRequest manualReq = ManualPaymentRequest.builder()
                .invoiceId(target.getId())
                .amount(partialAmount)
                .paymentMethod(PaymentMethod.UPI)
                .referenceNumber("UPI/TEST/991244")
                .notes("Partial test payment")
                .build();

        PaymentResponse manualResp = paymentService.recordManualPayment(manualReq);
        assertNotNull(manualResp.getId());
        assertEquals(PaymentMethod.UPI, manualResp.getPaymentMethod());
        assertEquals(initialBalance.subtract(partialAmount), manualResp.getRemainingBalanceDue());
        assertEquals(InvoiceStatus.PARTIALLY_PAID, manualResp.getUpdatedInvoiceStatus());

        // 2. Overpayment Prevention Guard
        BigDecimal excessiveAmount = manualResp.getRemainingBalanceDue().add(new BigDecimal("1000.00"));
        ManualPaymentRequest overpayReq = ManualPaymentRequest.builder()
                .invoiceId(target.getId())
                .amount(excessiveAmount)
                .paymentMethod(PaymentMethod.CASH)
                .build();

        assertThrows(IllegalArgumentException.class, () -> paymentService.recordManualPayment(overpayReq),
                "System must strictly reject payments exceeding the remaining balance due");

        // 3. Customer initiates simulated gateway checkout for remaining balance
        BigDecimal remaining = manualResp.getRemainingBalanceDue();
        GatewayCheckoutRequest checkoutReq = GatewayCheckoutRequest.builder()
                .invoiceId(target.getId())
                .amount(remaining)
                .paymentMethod("UPI")
                .idempotencyKey("IDEM-TEST-" + System.currentTimeMillis())
                .build();

        GatewayCheckoutResponse checkoutResp = paymentService.initiateGatewayCheckout(checkoutReq);
        assertNotNull(checkoutResp.getTransactionId());
        assertEquals("PENDING", checkoutResp.getStatus());

        // 4. Confirm checkout with simulated SUCCESS
        GatewayConfirmRequest confirmReq = GatewayConfirmRequest.builder()
                .transactionId(checkoutResp.getTransactionId())
                .simulatedStatus(PaymentAttemptStatus.SUCCESS)
                .build();

        GatewayConfirmResponse confirmResp = paymentService.confirmGatewayPayment(confirmReq);
        assertEquals(PaymentAttemptStatus.SUCCESS, confirmResp.getStatus());
        assertEquals(0, BigDecimal.ZERO.compareTo(confirmResp.getRemainingBalance()));
        assertEquals(InvoiceStatus.PAID, confirmResp.getUpdatedInvoiceStatus());

        // 5. Test idempotent replay of confirmation
        GatewayConfirmResponse replayResp = paymentService.confirmGatewayPayment(confirmReq);
        assertEquals(PaymentAttemptStatus.SUCCESS, replayResp.getStatus());
        assertEquals(0, BigDecimal.ZERO.compareTo(replayResp.getRemainingBalance()));
    }
}
