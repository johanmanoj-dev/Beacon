package com.brightloop.scenarios;

import com.brightloop.catalogue.*;
import com.brightloop.catalogue.dto.*;
import com.brightloop.customers.CustomerDto;
import com.brightloop.customers.CustomerService;
import com.brightloop.subscriptions.*;
import com.brightloop.subscriptions.dto.*;
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
public class JohanPhase5EdgeCasesTest {

    @Autowired
    private ProductService productService;

    @Autowired
    private PlanService planService;

    @Autowired
    private CustomerService customerService;

    @Autowired
    private QuotationService quotationService;

    @Autowired
    private SubscriptionService subscriptionService;

    @Test
    @DisplayName("Edge Case 1: Negative Product Price Rejection")
    void testNegativeProductPriceRejection() {
        ProductRequest negReq = ProductRequest.builder()
                .name("Faulty Product")
                .productType(ProductType.SOFTWARE)
                .salesPrice(new BigDecimal("-100.00"))
                .costPrice(new BigDecimal("50.00"))
                .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                productService.createProduct(negReq)
        );
        assertTrue(ex.getMessage().contains("cannot be negative"));
    }

    @Test
    @DisplayName("Edge Case 2: Plan Start Date after End Date Rejection")
    void testPlanInvalidDateWindowRejection() {
        PlanRequest invalidPlan = PlanRequest.builder()
                .name("Invalid Date Plan")
                .billingInterval(BillingInterval.MONTHLY)
                .basePrice(new BigDecimal("100.00"))
                .startDate(LocalDate.now().plusMonths(2))
                .endDate(LocalDate.now().plusMonths(1)) // End before start!
                .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                planService.createPlan(invalidPlan)
        );
        assertTrue(ex.getMessage().contains("cannot be after end date"));
    }

    @Test
    @DisplayName("Edge Case 3: Double Conversion of Quotation Strictly Prevented")
    void testDoubleConversionPrevented() {
        CustomerDto cust = customerService.createCustomer(CustomerDto.builder()
                .companyName("Test Double Convert Corp")
                .contactEmail("test.convert@corp.com")
                .build());

        PlanResponse plan = planService.createPlan(PlanRequest.builder()
                .name("Simple Monthly")
                .billingInterval(BillingInterval.MONTHLY)
                .basePrice(new BigDecimal("500.00"))
                .minQuantity(1)
                .canPause(true)
                .build());

        ProductResponse prod = productService.createProduct(ProductRequest.builder()
                .name("Simple Item")
                .productType(ProductType.SOFTWARE)
                .salesPrice(new BigDecimal("500.00"))
                .costPrice(new BigDecimal("200.00"))
                .build());

        QuotationResponse quote = quotationService.createQuotation(QuotationRequest.builder()
                .customerId(cust.getId())
                .planId(plan.getId())
                .items(List.of(QuotationItemDto.builder()
                        .productId(prod.getId())
                        .quantity(1)
                        .unitPrice(new BigDecimal("500.00"))
                        .build()))
                .build());

        // First conversion succeeds
        SubscriptionResponse sub1 = quotationService.convertToSubscription(quote.getId());
        assertNotNull(sub1.getId());

        // Second conversion attempt MUST throw IllegalStateException
        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                quotationService.convertToSubscription(quote.getId())
        );
        assertTrue(ex.getMessage().contains("already been converted"));
    }

    @Test
    @DisplayName("Edge Case 4: Closed Subscription Cannot Be Paused or Resumed")
    void testClosedSubscriptionStateGuards() {
        CustomerDto cust = customerService.createCustomer(CustomerDto.builder()
                .companyName("Closed Guard Corp")
                .contactEmail("closed.guard@corp.com")
                .build());

        PlanResponse plan = planService.createPlan(PlanRequest.builder()
                .name("Guard Plan")
                .billingInterval(BillingInterval.MONTHLY)
                .basePrice(new BigDecimal("500.00"))
                .canPause(true)
                .build());

        QuotationResponse quote = quotationService.createQuotation(QuotationRequest.builder()
                .customerId(cust.getId())
                .planId(plan.getId())
                .build());

        SubscriptionResponse sub = quotationService.convertToSubscription(quote.getId());

        // Close early
        SubscriptionResponse closed = subscriptionService.closeSubscription(sub.getId(), "Early test closure");
        assertEquals(SubscriptionStatus.CLOSED, closed.getStatus());

        // Attempting to pause a closed subscription must fail
        IllegalStateException pauseEx = assertThrows(IllegalStateException.class, () ->
                subscriptionService.pauseSubscription(closed.getId())
        );
        assertTrue(pauseEx.getMessage().contains("Cannot pause a closed subscription"));

        // Attempting to resume a closed subscription must fail
        IllegalStateException resumeEx = assertThrows(IllegalStateException.class, () ->
                subscriptionService.resumeSubscription(closed.getId())
        );
        assertTrue(resumeEx.getMessage().contains("Cannot resume a closed subscription"));
    }
}
