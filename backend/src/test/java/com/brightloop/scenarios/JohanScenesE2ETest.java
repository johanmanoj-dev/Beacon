package com.brightloop.scenarios;

import com.brightloop.auth.AuthService;
import com.brightloop.auth.dto.AuthResponse;
import com.brightloop.auth.dto.RegisterRequest;
import com.brightloop.catalogue.*;
import com.brightloop.catalogue.dto.*;
import com.brightloop.customers.CustomerDto;
import com.brightloop.customers.CustomerService;
import com.brightloop.subscriptions.*;
import com.brightloop.subscriptions.dto.*;
import com.brightloop.users.Role;
import com.brightloop.users.UserService;
import com.brightloop.users.dto.UserResponse;
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
public class JohanScenesE2ETest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserService userService;

    @Autowired
    private CustomerService customerService;

    @Autowired
    private ProductService productService;

    @Autowired
    private PlanService planService;

    @Autowired
    private QuotationService quotationService;

    @Autowired
    private SubscriptionService subscriptionService;

    @Test
    @DisplayName("Scene 1: New Customer Onboarding, Password Policy Enforcement & Staff Creation")
    void testScene1_CustomerOnboardingAndStaffCreation() {
        // 1. Weak password must fail validation
        RegisterRequest weakReq = RegisterRequest.builder()
                .email("weakuser@retailcorp.com")
                .fullName("Weak User")
                .password("weak123")
                .build();

        assertThrows(IllegalArgumentException.class, () -> authService.register(weakReq),
                "Should fail when password lacks uppercase and special character");

        // 2. Compliant password succeeds and provisions Customer
        RegisterRequest compliantReq = RegisterRequest.builder()
                .email("alice.judge@retailcorp.com")
                .fullName("Alice Retailer")
                .password("CompliantPass123!")
                .companyName("RetailCorp Enterprise Ltd")
                .phone("+1-555-9000")
                .role(Role.CUSTOMER)
                .build();

        AuthResponse authResp = authService.register(compliantReq);
        assertNotNull(authResp.getToken());
        assertEquals("alice.judge@retailcorp.com", authResp.getUser().getEmail());
        assertEquals(Role.CUSTOMER, authResp.getUser().getRole());
        assertNotNull(authResp.getUser().getCustomerId(), "Customer entity should be automatically created and linked");

        // 3. Admin creates an internal staff account
        RegisterRequest staffReq = RegisterRequest.builder()
                .email("bob.staff@brightloop.com")
                .fullName("Bob Jenkins")
                .password("StaffSecret456#")
                .build();

        UserResponse staffUser = userService.createStaff(staffReq);
        assertNotNull(staffUser.getId());
        assertEquals(Role.STAFF, staffUser.getRole());
        assertTrue(staffUser.getIsActive());
    }

    @Test
    @DisplayName("Scene 2: Product Catalog, Variant Price Calculation (+560 Odoo) & Plan Lifecycle Rules")
    void testScene2_ProductCatalogVariantAndPlanSetup() {
        // 1. Create Base Product "Cloud ERP Software" ($1000) with Variant "Brand: Odoo" (+$560)
        ProductVariantDto odooVariant = ProductVariantDto.builder()
                .variantName("Brand: Odoo")
                .priceAdjustment(new BigDecimal("560.00"))
                .build();

        ProductRequest prodReq = ProductRequest.builder()
                .name("Cloud ERP Software Demo")
                .productType(ProductType.SOFTWARE)
                .salesPrice(new BigDecimal("1000.00"))
                .costPrice(new BigDecimal("400.00"))
                .notes("Flagship ERP suite")
                .variants(List.of(odooVariant))
                .build();

        ProductResponse prod = productService.createProduct(prodReq);
        assertNotNull(prod.getId());
        assertEquals(new BigDecimal("1000.00"), prod.getSalesPrice());
        assertEquals(1, prod.getVariants().size());

        Long variantId = prod.getVariants().get(0).getId();

        // 2. Calculate effective price with Odoo variant: 1000 + 560 = 1560
        BigDecimal effectivePrice = productService.calculateEffectivePrice(prod.getId(), variantId);
        assertEquals(new BigDecimal("1560.00"), effectivePrice, "Base $1000 + Odoo $560 must equal $1560");

        // 3. Create Monthly Business Plan
        PlanRequest planReq = PlanRequest.builder()
                .name("Monthly Business Plan Demo")
                .billingInterval(BillingInterval.MONTHLY)
                .basePrice(new BigDecimal("1500.00"))
                .minQuantity(1)
                .canPause(true)
                .autoCloseOnEnd(false)
                .build();

        PlanResponse plan = planService.createPlan(planReq);
        assertNotNull(plan.getId());
        assertEquals(BillingInterval.MONTHLY, plan.getBillingInterval());
        assertTrue(plan.getCanPause());
    }

    @Test
    @DisplayName("Scene 3: Quotation with Variant Line Items to Active Subscription Conversion & Lifecycle State Machine")
    void testScene3_QuotationToSubscriptionConversion() {
        // 1. Setup Customer and Plan
        CustomerDto cust = customerService.createCustomer(CustomerDto.builder()
                .companyName("Matrix Logistics Ltd")
                .contactEmail("billing@matrixlogistics.com")
                .phone("+1-555-8888")
                .build());

        ProductResponse prod = productService.createProduct(ProductRequest.builder()
                .name("Supply Chain Core")
                .productType(ProductType.SOFTWARE)
                .salesPrice(new BigDecimal("1000.00"))
                .costPrice(new BigDecimal("400.00"))
                .variants(List.of(ProductVariantDto.builder()
                        .variantName("Brand: Odoo")
                        .priceAdjustment(new BigDecimal("560.00"))
                        .build()))
                .build());

        Long variantId = prod.getVariants().get(0).getId();

        PlanResponse plan = planService.createPlan(PlanRequest.builder()
                .name("Monthly Supply Plan")
                .billingInterval(BillingInterval.MONTHLY)
                .basePrice(new BigDecimal("1500.00"))
                .minQuantity(1)
                .canPause(true)
                .build());

        // 2. Create Quotation with Odoo variant line
        QuotationItemDto item = QuotationItemDto.builder()
                .productId(prod.getId())
                .variantId(variantId)
                .quantity(2)
                .unitPrice(new BigDecimal("1560.00"))
                .taxRatePercent(new BigDecimal("18.00"))
                .build();

        QuotationResponse quote = quotationService.createQuotation(QuotationRequest.builder()
                .customerId(cust.getId())
                .planId(plan.getId())
                .validUntil(LocalDate.now().plusDays(30))
                .items(List.of(item))
                .build());

        assertEquals(QuotationStatus.DRAFT, quote.getStatus());
        assertEquals(new BigDecimal("3120.00"), quote.getSubtotal()); // 1560 * 2 = 3120
        assertEquals(new BigDecimal("561.60"), quote.getTaxAmount()); // 18% of 3120 = 561.60
        assertEquals(new BigDecimal("3681.60"), quote.getTotalAmount());

        // Transition Draft -> Quotation -> Confirmed
        quotationService.updateStatus(quote.getId(), QuotationStatus.QUOTATION);
        quotationService.updateStatus(quote.getId(), QuotationStatus.CONFIRMED);

        // 3. One-click conversion to Subscription
        SubscriptionResponse sub = quotationService.convertToSubscription(quote.getId());
        assertNotNull(sub.getId());
        assertTrue(sub.getSubscriptionNumber().startsWith("SUB-"));
        assertEquals(SubscriptionStatus.ACTIVE, sub.getStatus());
        assertEquals(LocalDate.now().plusMonths(1), sub.getNextBillingDate(), "Next billing date must advance by 1 month for Monthly plan");

        // Verify line item price snapshotting
        assertEquals(1, sub.getItems().size());
        assertEquals(new BigDecimal("1560.00"), sub.getItems().get(0).getUnitPrice());

        // 4. Test Lifecycle State Machine: Pause -> Resume
        SubscriptionResponse paused = subscriptionService.pauseSubscription(sub.getId());
        assertEquals(SubscriptionStatus.PAUSED, paused.getStatus());

        SubscriptionResponse resumed = subscriptionService.resumeSubscription(sub.getId());
        assertEquals(SubscriptionStatus.ACTIVE, resumed.getStatus());
    }
}
