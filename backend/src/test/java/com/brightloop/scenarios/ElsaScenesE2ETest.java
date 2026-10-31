package com.brightloop.scenarios;

import com.brightloop.billing.BillingService;
import com.brightloop.billing.dto.BillingRunResponse;
import com.brightloop.catalogue.*;
import com.brightloop.customers.Customer;
import com.brightloop.customers.CustomerRepository;
import com.brightloop.discounts.Discount;
import com.brightloop.discounts.DiscountRepository;
import com.brightloop.discounts.DiscountScope;
import com.brightloop.discounts.DiscountType;
import com.brightloop.invoices.Invoice;
import com.brightloop.invoices.InvoiceRepository;
import com.brightloop.invoices.InvoiceStatus;
import com.brightloop.payments.PaymentMethod;
import com.brightloop.payments.PaymentService;
import com.brightloop.payments.dto.CheckoutSessionRequest;
import com.brightloop.payments.dto.CheckoutSessionResponse;
import com.brightloop.payments.dto.ConfirmPaymentRequest;
import com.brightloop.payments.dto.ManualPaymentRequest;
import com.brightloop.subscriptions.*;
import com.brightloop.taxes.TaxRate;
import com.brightloop.taxes.TaxRateRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("default")
public class ElsaScenesE2ETest {

    @Autowired
    private BillingService billingService;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private PlanRepository planRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductVariantRepository productVariantRepository;

    @Autowired
    private TaxRateRepository taxRateRepository;

    @Autowired
    private DiscountRepository discountRepository;

    private Customer testCustomer;
    private Plan testPlan;
    private Product testProduct;
    private ProductVariant testVariant;

    @BeforeEach
    void setUp() {
        // Ensure standard 18% GST exists
        if (taxRateRepository.findByIsActiveTrue().isEmpty()) {
            taxRateRepository.save(TaxRate.builder()
                    .name("Standard GST 18%")
                    .ratePercent(new BigDecimal("18.00"))
                    .isActive(true)
                    .build());
        }

        // Ensure 10% volume discount exists
        if (discountRepository.findByCode("VOLUME10").isEmpty() && discountRepository.findByCode("VOL10").isEmpty()) {
            discountRepository.save(Discount.builder()
                    .code("VOLUME10")
                    .discountType(DiscountType.PERCENTAGE)
                    .value(new BigDecimal("10.00"))
                    .minPurchaseAmount(BigDecimal.ZERO)
                    .minQuantity(5)
                    .appliesTo(DiscountScope.SUBSCRIPTION)
                    .build());
        }

        testCustomer = customerRepository.save(Customer.builder()
                .companyName("Elsa Scenario Corp")
                .contactEmail("billing@elsacorp.io")
                .phone("+1 555-0199")
                .build());

        testPlan = planRepository.save(Plan.builder()
                .name("Elsa Monthly Enterprise")
                .billingInterval(BillingInterval.MONTHLY)
                .basePrice(new BigDecimal("1500.00"))
                .minQuantity(1)
                .canPause(true)
                .build());

        testProduct = productRepository.save(Product.builder()
                .name("Cloud ERP Core")
                .productType(ProductType.SOFTWARE)
                .salesPrice(new BigDecimal("1000.00"))
                .costPrice(new BigDecimal("400.00"))
                .build());

        testVariant = productVariantRepository.save(ProductVariant.builder()
                .product(testProduct)
                .variantName("Brand: Odoo")
                .priceAdjustment(new BigDecimal("560.00"))
                .build());
    }

    @Test
    @DisplayName("Scene 4: Billing Day Execution, Line Snapshotting & Strict Idempotency")
    @Transactional
    void testScene4_RecurringBillingAndIdempotency() {
        LocalDate runDate = LocalDate.now();

        // 1. Create active subscription with nextBillingDate <= today
        Subscription sub = Subscription.builder()
                .subscriptionNumber("SUB-ELSA-SCENE4-" + System.currentTimeMillis())
                .customer(testCustomer)
                .plan(testPlan)
                .status(SubscriptionStatus.ACTIVE)
                .startDate(runDate.minusMonths(1))
                .nextBillingDate(runDate)
                .items(new ArrayList<>())
                .build();

        // Add line items: Odoo ERP variant ($1,560.00, 18% tax)
        SubscriptionItem item = SubscriptionItem.builder()
                .subscription(sub)
                .product(testProduct)
                .variant(testVariant)
                .quantity(1)
                .unitPrice(new BigDecimal("1560.00"))
                .taxRatePercent(new BigDecimal("18.00"))
                .lineTotal(new BigDecimal("1840.80"))
                .build();
        sub.getItems().add(item);
        subscriptionRepository.save(sub);

        // 2. Execute billing engine as of today
        BillingRunResponse firstRun = billingService.runBilling(runDate);
        assertNotNull(firstRun);
        assertTrue(firstRun.getInvoicesCreated() >= 1, "At least 1 invoice must be generated");
        assertTrue(firstRun.getGeneratedInvoiceNumbers().size() >= 1);

        // Verify generated invoice has line item snapshot with exact price frozen
        Invoice generatedInvoice = invoiceRepository.findByCustomerId(testCustomer.getId()).stream()
                .filter(i -> i.getSubscription().getSubscriptionNumber().equals(sub.getSubscriptionNumber()))
                .findFirst()
                .orElseThrow(() -> new AssertionError("Invoice must be generated for subscription"));

        assertEquals(new BigDecimal("1560.00"), generatedInvoice.getSubtotal(), "Subtotal must freeze snapshot price");
        assertEquals(new BigDecimal("280.80"), generatedInvoice.getTaxAmount(), "18% GST on $1,560 is $280.80");
        assertEquals(new BigDecimal("1840.80"), generatedInvoice.getTotalAmount(), "Total = $1,560 + $280.80 = $1,840.80");
        assertEquals(new BigDecimal("1840.80"), generatedInvoice.getBalanceDue());
        assertEquals(InvoiceStatus.CONFIRMED, generatedInvoice.getStatus());
        assertFalse(generatedInvoice.getItems().isEmpty());
        assertEquals("Cloud ERP Core (Brand: Odoo)", generatedInvoice.getItems().get(0).getDescription());

        // Verify subscription nextBillingDate advanced to next monthly cycle
        Subscription reloadedSub = subscriptionRepository.findById(sub.getId()).orElseThrow();
        assertEquals(runDate.plusMonths(1), reloadedSub.getNextBillingDate(), "Next billing date must advance by 1 month");

        // 3. Strict Idempotency Check: Re-run engine on the same date/period
        BillingRunResponse secondRun = billingService.runBilling(runDate);
        assertNotNull(secondRun);
        assertEquals(0, secondRun.getInvoicesCreated(), "Idempotent re-run must generate 0 duplicate invoices");
        assertTrue(secondRun.getInvoicesSkipped() >= 1, "Subscription must be counted as skipped");
    }

    @Test
    @DisplayName("Scene 4: Volume Discount (10% off for >= 5 seats)")
    @Transactional
    void testScene4_VolumeDiscountApplication() {
        LocalDate runDate = LocalDate.now();

        Subscription sub = Subscription.builder()
                .subscriptionNumber("SUB-ELSA-VOL10-" + System.currentTimeMillis())
                .customer(testCustomer)
                .plan(testPlan)
                .status(SubscriptionStatus.ACTIVE)
                .startDate(runDate.minusMonths(1))
                .nextBillingDate(runDate)
                .items(new ArrayList<>())
                .build();

        // 10 seats of Cloud ERP Core + Odoo variant
        SubscriptionItem item = SubscriptionItem.builder()
                .subscription(sub)
                .product(testProduct)
                .variant(testVariant)
                .quantity(10)
                .unitPrice(new BigDecimal("1560.00"))
                .taxRatePercent(new BigDecimal("18.00"))
                .lineTotal(new BigDecimal("15600.00"))
                .build();
        sub.getItems().add(item);
        subscriptionRepository.save(sub);

        BillingRunResponse run = billingService.runBilling(runDate);
        assertTrue(run.getInvoicesCreated() >= 1);

        Invoice inv = invoiceRepository.findByCustomerId(testCustomer.getId()).stream()
                .filter(i -> i.getSubscription().getSubscriptionNumber().equals(sub.getSubscriptionNumber()))
                .findFirst().orElseThrow();

        // 10 seats * $1,560.00 = $15,600.00
        assertEquals(new BigDecimal("15600.00"), inv.getSubtotal());
        // 10% discount = $1,560.00
        assertEquals(new BigDecimal("1560.00"), inv.getDiscountAmount(), "10% volume discount should apply for >= 5 seats");
        // Taxable = 15600 - 1560 = 14040. Tax 18% = 2527.20
        assertEquals(new BigDecimal("2527.20"), inv.getTaxAmount());
        // Total = 14040 + 2527.20 = 16567.20
        assertEquals(new BigDecimal("16567.20"), inv.getTotalAmount());
    }

    @Test
    @DisplayName("Scene 6: Dual Payments - Staff Manual Partial ($500) + Gateway Checkout ($1060 to Paid)")
    @Transactional
    void testScene6_DualPaymentEngine() {
        Subscription sub = subscriptionRepository.save(Subscription.builder()
                .subscriptionNumber("SUB-ELSA-SCENE6-" + System.currentTimeMillis())
                .customer(testCustomer)
                .plan(testPlan)
                .status(SubscriptionStatus.ACTIVE)
                .startDate(LocalDate.now().minusMonths(1))
                .nextBillingDate(LocalDate.now())
                .build());

        // Create an invoice with total $1,560.00
        Invoice invoice = Invoice.builder()
                .invoiceNumber("INV-SCENE6-" + System.currentTimeMillis())
                .subscription(sub)
                .customer(testCustomer)
                .billingPeriodStart(LocalDate.now().minusDays(15))
                .billingPeriodEnd(LocalDate.now().plusDays(15))
                .issueDate(LocalDate.now())
                .dueDate(LocalDate.now().plusDays(15))
                .subtotal(new BigDecimal("1322.03"))
                .taxAmount(new BigDecimal("237.97"))
                .discountAmount(BigDecimal.ZERO)
                .totalAmount(new BigDecimal("1560.00"))
                .amountPaid(BigDecimal.ZERO)
                .balanceDue(new BigDecimal("1560.00"))
                .status(InvoiceStatus.CONFIRMED)
                .build();
        Invoice savedInv = invoiceRepository.save(invoice);

        // Step 1: Staff records partial UPI payment of $500.00
        ManualPaymentRequest manualReq = ManualPaymentRequest.builder()
                .invoiceId(savedInv.getId())
                .amount(new BigDecimal("500.00"))
                .paymentMethod(PaymentMethod.UPI)
                .referenceNumber("UPI/SCENE6/TEST001")
                .notes("Staff manual partial payment")
                .build();

        paymentService.recordManualPayment(manualReq);

        Invoice afterManual = invoiceRepository.findById(savedInv.getId()).orElseThrow();
        assertEquals(new BigDecimal("500.00"), afterManual.getAmountPaid());
        assertEquals(new BigDecimal("1060.00"), afterManual.getBalanceDue());
        assertEquals(InvoiceStatus.PARTIALLY_PAID, afterManual.getStatus(), "Status must be PARTIALLY_PAID after partial payment");

        // Step 2: Customer initiates Simulated Gateway Checkout for remaining $1,060.00
        CheckoutSessionRequest checkoutReq = CheckoutSessionRequest.builder()
                .invoiceId(savedInv.getId())
                .amount(new BigDecimal("1060.00"))
                .paymentMethod("NET_BANKING")
                .build();

        CheckoutSessionResponse checkoutRes = paymentService.initiateCheckoutSession(checkoutReq);
        assertNotNull(checkoutRes.getTransactionId());
        assertEquals("PENDING", checkoutRes.getStatus());

        // Step 3: Gateway completes with simulated SUCCESS
        ConfirmPaymentRequest confirmReq = ConfirmPaymentRequest.builder()
                .transactionId(checkoutRes.getTransactionId())
                .simulatedOutcome("SUCCESS")
                .paymentMethod("NET_BANKING")
                .build();

        paymentService.confirmPayment(confirmReq);

        Invoice afterGateway = invoiceRepository.findById(savedInv.getId()).orElseThrow();
        assertEquals(new BigDecimal("1560.00"), afterGateway.getAmountPaid(), "Total paid should equal invoice amount");
        assertEquals(0, new BigDecimal("0.00").compareTo(afterGateway.getBalanceDue()), "Balance due must drop to 0.00");
        assertEquals(InvoiceStatus.PAID, afterGateway.getStatus(), "Invoice status must transition to PAID");
    }
}
