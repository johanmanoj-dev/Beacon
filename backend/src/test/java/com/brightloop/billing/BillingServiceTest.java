package com.brightloop.billing;

import com.brightloop.billing.dto.BillingRunRequest;
import com.brightloop.billing.dto.BillingRunResult;
import com.brightloop.invoices.dto.InvoiceResponse;
import com.brightloop.invoices.InvoiceService;
import com.brightloop.invoices.InvoiceStatus;
import com.brightloop.subscriptions.Subscription;
import com.brightloop.subscriptions.SubscriptionRepository;
import com.brightloop.subscriptions.SubscriptionStatus;
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
public class BillingServiceTest {

    @Autowired
    private BillingService billingService;

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    @Autowired
    private InvoiceService invoiceService;

    @Test
    @DisplayName("Billing run generates invoice, advances next billing date, and verifies idempotency")
    void testBillingRunAndIdempotency() {
        // Find an active subscription from seeded data
        List<Subscription> activeSubs = subscriptionRepository.findByStatus(SubscriptionStatus.ACTIVE);
        assertFalse(activeSubs.isEmpty(), "Active subscriptions must be available from seeder");

        Subscription targetSub = activeSubs.get(0);
        LocalDate initialBillingDate = targetSub.getNextBillingDate();
        Long subId = targetSub.getId();

        // 1. Run billing for this subscription
        BillingRunRequest request = BillingRunRequest.builder()
                .subscriptionId(subId)
                .force(true)
                .build();

        BillingRunResult firstRunResult = billingService.executeBillingRun(request);

        assertNotNull(firstRunResult);
        assertEquals(1, firstRunResult.getInvoicesGenerated(), "First run should generate exactly 1 invoice");
        assertEquals(0, firstRunResult.getInvoicesSkipped(), "First run should skip 0 invoices");
        assertTrue(firstRunResult.getTotalAmountBilled().compareTo(BigDecimal.ZERO) > 0, "Billed amount must be positive");
        assertFalse(firstRunResult.getGeneratedInvoiceNumbers().isEmpty(), "Invoice number list should not be empty");

        // Verify next billing date advanced
        Subscription updatedSub = subscriptionRepository.findById(subId).orElseThrow();
        assertNotEquals(initialBillingDate, updatedSub.getNextBillingDate(), "Next billing date should have advanced");

        // 2. Idempotency test: Rerun without force
        BillingRunRequest repeatRequest = BillingRunRequest.builder()
                .subscriptionId(subId)
                .force(false)
                .targetDate(initialBillingDate)
                .build();

        BillingRunResult secondRunResult = billingService.executeBillingRun(repeatRequest);

        assertEquals(0, secondRunResult.getInvoicesGenerated(), "Idempotent re-run must generate 0 new invoices");
        assertEquals(1, secondRunResult.getInvoicesSkipped(), "Idempotent re-run must skip duplicate period");
    }

    @Test
    @DisplayName("Invoice status transitions: confirm and cancel")
    void testInvoiceStatusTransitions() {
        var allInvoices = invoiceService.getAllInvoices();
        assertFalse(allInvoices.isEmpty(), "Invoices must exist in database");

        var firstInvoice = allInvoices.get(0);
        Long invId = firstInvoice.getId();

        // Confirm invoice
        var confirmed = invoiceService.confirmInvoice(invId);
        assertEquals(InvoiceStatus.CONFIRMED, confirmed.getStatus());

        // Cancel invoice
        var cancelled = invoiceService.cancelInvoice(invId);
        assertEquals(InvoiceStatus.CANCELLED, cancelled.getStatus());
        assertEquals(BigDecimal.ZERO, cancelled.getBalanceDue());
    }
}
