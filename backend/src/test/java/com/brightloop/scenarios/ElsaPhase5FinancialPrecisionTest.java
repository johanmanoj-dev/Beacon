package com.brightloop.scenarios;

import com.brightloop.billing.BillingService;
import com.brightloop.catalogue.*;
import com.brightloop.customers.Customer;
import com.brightloop.customers.CustomerRepository;
import com.brightloop.discounts.*;
import com.brightloop.discounts.dto.DiscountDto;
import com.brightloop.discounts.dto.DiscountValidationRequest;
import com.brightloop.discounts.dto.DiscountValidationResult;
import com.brightloop.invoices.Invoice;
import com.brightloop.invoices.InvoiceRepository;
import com.brightloop.invoices.InvoiceService;
import com.brightloop.invoices.InvoiceStatus;
import com.brightloop.payments.PaymentMethod;
import com.brightloop.payments.PaymentService;
import com.brightloop.payments.dto.CheckoutSessionRequest;
import com.brightloop.payments.dto.ConfirmPaymentRequest;
import com.brightloop.payments.dto.ManualPaymentRequest;
import com.brightloop.payments.dto.PaymentResponse;
import com.brightloop.subscriptions.Subscription;
import com.brightloop.subscriptions.SubscriptionItem;
import com.brightloop.subscriptions.SubscriptionRepository;
import com.brightloop.subscriptions.SubscriptionStatus;
import com.brightloop.taxes.TaxRate;
import com.brightloop.taxes.TaxRateRepository;
import com.brightloop.taxes.TaxRateService;
import com.brightloop.taxes.dto.TaxRateDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("default")
@Transactional
public class ElsaPhase5FinancialPrecisionTest {

    private static final AtomicLong SEQ = new AtomicLong(1000);

    @Autowired
    private BillingService billingService;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private InvoiceService invoiceService;

    @Autowired
    private TaxRateService taxRateService;

    @Autowired
    private DiscountService discountService;

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
    private Subscription testSubscription;

    @BeforeEach
    void setUp() {
        testCustomer = customerRepository.save(Customer.builder()
                .companyName("Precision Corp")
                .contactEmail("finance" + SEQ.incrementAndGet() + "@precisioncorp.io")
                .phone("+1 555-0999")
                .build());

        testPlan = planRepository.save(Plan.builder()
                .name("Precision Plan " + SEQ.incrementAndGet())
                .billingInterval(BillingInterval.MONTHLY)
                .basePrice(new BigDecimal("1000.00"))
                .minQuantity(1)
                .canPause(true)
                .build());

        testProduct = productRepository.save(Product.builder()
                .name("Precision ERP Core " + SEQ.incrementAndGet())
                .productType(ProductType.SOFTWARE)
                .salesPrice(new BigDecimal("1000.00"))
                .costPrice(new BigDecimal("400.00"))
                .build());

        testVariant = productVariantRepository.save(ProductVariant.builder()
                .product(testProduct)
                .variantName("Brand: Odoo")
                .priceAdjustment(new BigDecimal("560.00"))
                .build());

        testSubscription = subscriptionRepository.save(Subscription.builder()
                .subscriptionNumber("SUB-P5-" + SEQ.incrementAndGet())
                .customer(testCustomer)
                .plan(testPlan)
                .status(SubscriptionStatus.ACTIVE)
                .startDate(LocalDate.now().minusMonths(1))
                .nextBillingDate(LocalDate.now())
                .items(new ArrayList<>())
                .build());
    }

    @Test
    @DisplayName("Elsa Phase 5 - Test 1: Financial Precision in Billing Calculations (Zero Floating-Point Drift)")
    void testFinancialPrecisionInBilling() {
        LocalDate runDate = LocalDate.now();

        Subscription sub = Subscription.builder()
                .subscriptionNumber("SUB-PREC-" + SEQ.incrementAndGet())
                .customer(testCustomer)
                .plan(testPlan)
                .status(SubscriptionStatus.ACTIVE)
                .startDate(runDate.minusMonths(1))
                .nextBillingDate(runDate)
                .items(new ArrayList<>())
                .build();

        // 3 items @ $1560.00 with 18% GST
        sub.getItems().add(SubscriptionItem.builder()
                .subscription(sub)
                .product(testProduct)
                .variant(testVariant)
                .quantity(3)
                .unitPrice(new BigDecimal("1560.00"))
                .taxRatePercent(new BigDecimal("18.00"))
                .lineTotal(new BigDecimal("5522.40"))
                .build());

        subscriptionRepository.save(sub);

        billingService.runBilling(runDate);

        Invoice inv = invoiceRepository.findBySubscriptionId(sub.getId()).get(0);
        // Subtotal: 3 * 1560.00 = 4680.00
        assertEquals(new BigDecimal("4680.00"), inv.getSubtotal());
        // Tax: 4680.00 * 18% = 842.40
        assertEquals(new BigDecimal("842.40"), inv.getTaxAmount());
        // Total: 4680.00 + 842.40 = 5522.40
        assertEquals(new BigDecimal("5522.40"), inv.getTotalAmount());
        assertEquals(new BigDecimal("5522.40"), inv.getBalanceDue());
        assertEquals(new BigDecimal("0.00"), inv.getAmountPaid());
        assertEquals(2, inv.getTotalAmount().scale(), "Currency scale must strictly be 2");
    }

    @Test
    @DisplayName("Elsa Phase 5 - Test 2: Overpayment Strictly Prevented in Manual Payments")
    void testOverpaymentPreventedInManualPayment() {
        Invoice invoice = invoiceRepository.save(Invoice.builder()
                .invoiceNumber("INV-P5-" + SEQ.incrementAndGet())
                .subscription(testSubscription)
                .customer(testCustomer)
                .billingPeriodStart(LocalDate.now().minusMonths(1))
                .billingPeriodEnd(LocalDate.now())
                .issueDate(LocalDate.now())
                .dueDate(LocalDate.now().plusDays(15))
                .subtotal(new BigDecimal("1000.00"))
                .taxAmount(new BigDecimal("180.00"))
                .totalAmount(new BigDecimal("1180.00"))
                .amountPaid(BigDecimal.ZERO)
                .balanceDue(new BigDecimal("1180.00"))
                .status(InvoiceStatus.CONFIRMED)
                .build());

        // Attempt overpayment of $1200.00 on an $1180.00 invoice
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                paymentService.recordManualPayment(ManualPaymentRequest.builder()
                        .invoiceId(invoice.getId())
                        .amount(new BigDecimal("1200.00"))
                        .paymentMethod(PaymentMethod.UPI)
                        .build())
        );
        assertTrue(ex.getMessage().contains("cannot exceed outstanding balance due"));

        // Attempt negative payment
        IllegalArgumentException negEx = assertThrows(IllegalArgumentException.class, () ->
                paymentService.recordManualPayment(ManualPaymentRequest.builder()
                        .invoiceId(invoice.getId())
                        .amount(new BigDecimal("-50.00"))
                        .paymentMethod(PaymentMethod.CASH)
                        .build())
        );
        assertTrue(negEx.getMessage().contains("greater than zero"));
    }

    @Test
    @DisplayName("Elsa Phase 5 - Test 3: Fully Paid Invoice Rejects Further Payments")
    void testFullyPaidInvoiceRejectsFurtherPayments() {
        Invoice invoice = invoiceRepository.save(Invoice.builder()
                .invoiceNumber("INV-P5-" + SEQ.incrementAndGet())
                .subscription(testSubscription)
                .customer(testCustomer)
                .billingPeriodStart(LocalDate.now().minusMonths(1))
                .billingPeriodEnd(LocalDate.now())
                .issueDate(LocalDate.now())
                .dueDate(LocalDate.now().plusDays(15))
                .subtotal(new BigDecimal("500.00"))
                .taxAmount(new BigDecimal("90.00"))
                .totalAmount(new BigDecimal("590.00"))
                .amountPaid(new BigDecimal("590.00"))
                .balanceDue(new BigDecimal("0.00"))
                .status(InvoiceStatus.PAID)
                .build());

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                paymentService.recordManualPayment(ManualPaymentRequest.builder()
                        .invoiceId(invoice.getId())
                        .amount(new BigDecimal("100.00"))
                        .paymentMethod(PaymentMethod.CREDIT_CARD)
                        .build())
        );
        assertTrue(ex.getMessage().contains("already fully paid"));
    }

    @Test
    @DisplayName("Elsa Phase 5 - Test 4: Simulated Gateway Checkout Overpayment Rejection & Idempotent Confirmation")
    void testSimulatedGatewayGuardsAndReplayIdempotency() {
        Invoice invoice = invoiceRepository.save(Invoice.builder()
                .invoiceNumber("INV-P5-" + SEQ.incrementAndGet())
                .subscription(testSubscription)
                .customer(testCustomer)
                .billingPeriodStart(LocalDate.now().minusMonths(1))
                .billingPeriodEnd(LocalDate.now())
                .issueDate(LocalDate.now())
                .dueDate(LocalDate.now().plusDays(15))
                .subtotal(new BigDecimal("1000.00"))
                .taxAmount(new BigDecimal("180.00"))
                .totalAmount(new BigDecimal("1180.00"))
                .amountPaid(BigDecimal.ZERO)
                .balanceDue(new BigDecimal("1180.00"))
                .status(InvoiceStatus.CONFIRMED)
                .build());

        // Attempting checkout for amount exceeding balance due must fail
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                paymentService.initiateCheckoutSession(CheckoutSessionRequest.builder()
                        .invoiceId(invoice.getId())
                        .amount(new BigDecimal("1500.00"))
                        .paymentMethod("UPI")
                        .build())
        );
        assertTrue(ex.getMessage().contains("cannot exceed invoice balance due"));

        // Valid checkout initiation
        var session = paymentService.initiateCheckoutSession(CheckoutSessionRequest.builder()
                .invoiceId(invoice.getId())
                .amount(new BigDecimal("500.00"))
                .paymentMethod("UPI")
                .build());

        assertNotNull(session.getTransactionId());

        // Confirm success
        PaymentResponse p1 = paymentService.confirmPayment(ConfirmPaymentRequest.builder()
                .transactionId(session.getTransactionId())
                .simulatedOutcome("SUCCESS")
                .build());

        assertNotNull(p1.getId());
        assertEquals(new BigDecimal("500.00"), p1.getAmount());

        // Check invoice balance: 1180 - 500 = 680
        Invoice updated = invoiceRepository.findById(invoice.getId()).orElseThrow();
        assertEquals(new BigDecimal("680.00"), updated.getBalanceDue());
        assertEquals(InvoiceStatus.PARTIALLY_PAID, updated.getStatus());

        // Idempotent confirmation replay: Replaying the same transaction confirmation must NOT deduct balance again
        PaymentResponse p2 = paymentService.confirmPayment(ConfirmPaymentRequest.builder()
                .transactionId(session.getTransactionId())
                .simulatedOutcome("SUCCESS")
                .build());

        assertEquals(p1.getId(), p2.getId());
        Invoice rechecked = invoiceRepository.findById(invoice.getId()).orElseThrow();
        assertEquals(new BigDecimal("680.00"), rechecked.getBalanceDue(), "Balance must remain unchanged after idempotent replay");
    }

    @Test
    @DisplayName("Elsa Phase 5 - Test 5: Tax Rate Bounds & Precision Validation")
    void testTaxRateValidation() {
        // Negative tax rate rejected
        IllegalArgumentException negEx = assertThrows(IllegalArgumentException.class, () ->
                taxRateService.createTaxRate(TaxRateDto.builder()
                        .name("Invalid Negative " + SEQ.incrementAndGet())
                        .ratePercent(new BigDecimal("-5.00"))
                        .build())
        );
        assertTrue(negEx.getMessage().contains("cannot be negative"));

        // Tax rate > 100% rejected
        IllegalArgumentException overEx = assertThrows(IllegalArgumentException.class, () ->
                taxRateService.createTaxRate(TaxRateDto.builder()
                        .name("Invalid Excessive " + SEQ.incrementAndGet())
                        .ratePercent(new BigDecimal("105.00"))
                        .build())
        );
        assertTrue(overEx.getMessage().contains("cannot exceed 100.00%"));

        // Blank name rejected
        IllegalArgumentException blankEx = assertThrows(IllegalArgumentException.class, () ->
                taxRateService.createTaxRate(TaxRateDto.builder()
                        .name("   ")
                        .ratePercent(new BigDecimal("18.00"))
                        .build())
        );
        assertTrue(blankEx.getMessage().contains("name is required"));
    }

    @Test
    @DisplayName("Elsa Phase 5 - Test 6: Discount Bounds, Date Windows & Simulator Validation")
    void testDiscountValidationAndSimulator() {
        // Percentage discount > 100% rejected
        IllegalArgumentException pctEx = assertThrows(IllegalArgumentException.class, () ->
                discountService.createDiscount(DiscountDto.builder()
                        .code("EXCESS" + SEQ.incrementAndGet())
                        .discountType(DiscountType.PERCENTAGE)
                        .value(new BigDecimal("150.00"))
                        .build())
        );
        assertTrue(pctEx.getMessage().contains("cannot exceed 100%"));

        // Negative discount value rejected
        IllegalArgumentException negValEx = assertThrows(IllegalArgumentException.class, () ->
                discountService.createDiscount(DiscountDto.builder()
                        .code("NEGVAL" + SEQ.incrementAndGet())
                        .discountType(DiscountType.FIXED_AMOUNT)
                        .value(new BigDecimal("-20.00"))
                        .build())
        );
        assertTrue(negValEx.getMessage().contains("greater than zero"));

        // Start date after end date rejected
        IllegalArgumentException dateEx = assertThrows(IllegalArgumentException.class, () ->
                discountService.createDiscount(DiscountDto.builder()
                        .code("INVDAT" + SEQ.incrementAndGet())
                        .discountType(DiscountType.PERCENTAGE)
                        .value(new BigDecimal("10.00"))
                        .startDate(LocalDate.now().plusMonths(2))
                        .endDate(LocalDate.now().plusMonths(1))
                        .build())
        );
        assertTrue(dateEx.getMessage().contains("cannot be after end date"));

        // Valid discount creation
        String code = "PROMO" + SEQ.incrementAndGet();
        discountService.createDiscount(DiscountDto.builder()
                .code(code)
                .discountType(DiscountType.PERCENTAGE)
                .value(new BigDecimal("15.00"))
                .minQuantity(2)
                .minPurchaseAmount(new BigDecimal("500.00"))
                .build());

        // Simulator: Qualifies (amount $1000, qty 3) -> 15% discount = $150.00, final = $850.00
        DiscountValidationResult qualResult = discountService.validateDiscount(DiscountValidationRequest.builder()
                .code(code)
                .amount(new BigDecimal("1000.00"))
                .quantity(3)
                .build());

        assertTrue(qualResult.isValid());
        assertEquals(new BigDecimal("150.00"), qualResult.getDiscountAmount());
        assertEquals(new BigDecimal("850.00"), qualResult.getFinalAmount());

        // Simulator: Does not qualify on quantity (qty 1 < min 2)
        DiscountValidationResult failQty = discountService.validateDiscount(DiscountValidationRequest.builder()
                .code(code)
                .amount(new BigDecimal("1000.00"))
                .quantity(1)
                .build());

        assertFalse(failQty.isValid());
        assertTrue(failQty.getMessage().contains("Minimum quantity"));
    }

    @Test
    @DisplayName("Elsa Phase 5 - Test 7: Invoice Lifecycle Guards (Cannot Cancel Paid Invoice)")
    void testInvoiceLifecycleGuards() {
        Invoice invoice = invoiceRepository.save(Invoice.builder()
                .invoiceNumber("INV-P5-" + SEQ.incrementAndGet())
                .subscription(testSubscription)
                .customer(testCustomer)
                .billingPeriodStart(LocalDate.now().minusMonths(1))
                .billingPeriodEnd(LocalDate.now())
                .issueDate(LocalDate.now())
                .dueDate(LocalDate.now().plusDays(15))
                .subtotal(new BigDecimal("500.00"))
                .taxAmount(new BigDecimal("90.00"))
                .totalAmount(new BigDecimal("590.00"))
                .amountPaid(new BigDecimal("590.00"))
                .balanceDue(new BigDecimal("0.00"))
                .status(InvoiceStatus.PAID)
                .build());

        // Attempting to cancel a paid invoice must fail
        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                invoiceService.cancelInvoice(invoice.getId())
        );
        assertTrue(ex.getMessage().contains("Cannot cancel an already fully paid invoice"));
    }
}
