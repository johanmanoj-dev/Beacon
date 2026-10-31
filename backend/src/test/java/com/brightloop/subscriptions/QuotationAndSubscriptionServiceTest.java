package com.brightloop.subscriptions;

import com.brightloop.catalogue.BillingInterval;
import com.brightloop.catalogue.Plan;
import com.brightloop.catalogue.PlanRepository;
import com.brightloop.catalogue.Product;
import com.brightloop.catalogue.ProductRepository;
import com.brightloop.catalogue.ProductType;
import com.brightloop.catalogue.ProductVariant;
import com.brightloop.catalogue.ProductVariantRepository;
import com.brightloop.customers.Customer;
import com.brightloop.customers.CustomerRepository;
import com.brightloop.subscriptions.dto.QuotationItemDto;
import com.brightloop.subscriptions.dto.QuotationRequest;
import com.brightloop.subscriptions.dto.QuotationResponse;
import com.brightloop.subscriptions.dto.SubscriptionResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class QuotationAndSubscriptionServiceTest {

    @Mock
    private QuotationRepository quotationRepository;

    @Mock
    private QuotationTemplateRepository templateRepository;

    @Mock
    private SubscriptionRepository subscriptionRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private PlanRepository planRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductVariantRepository variantRepository;

    @InjectMocks
    private QuotationService quotationService;

    @InjectMocks
    private SubscriptionService subscriptionService;

    private Customer mockCustomer;
    private Plan mockPlan;
    private Product mockProduct;
    private ProductVariant mockVariant;

    @BeforeEach
    void setUp() {
        mockCustomer = Customer.builder()
                .id(1L)
                .companyName("Acme Corp")
                .contactEmail("contact@acme.com")
                .build();

        mockPlan = Plan.builder()
                .id(10L)
                .name("Monthly Pro")
                .billingInterval(BillingInterval.MONTHLY)
                .basePrice(new BigDecimal("1500.00"))
                .minQuantity(1)
                .canPause(true)
                .build();

        mockProduct = Product.builder()
                .id(100L)
                .name("Brightloop ERP")
                .productType(ProductType.SOFTWARE)
                .salesPrice(new BigDecimal("1000.00"))
                .costPrice(new BigDecimal("400.00"))
                .variants(new ArrayList<>())
                .build();

        mockVariant = ProductVariant.builder()
                .id(200L)
                .product(mockProduct)
                .variantName("Brand: Odoo")
                .priceAdjustment(new BigDecimal("560.00"))
                .build();
    }

    @Test
    void testCreateQuotationWithVariantPriceCalculation() {
        when(customerRepository.findById(1L)).thenReturn(Optional.of(mockCustomer));
        when(planRepository.findById(10L)).thenReturn(Optional.of(mockPlan));
        when(productRepository.findById(100L)).thenReturn(Optional.of(mockProduct));
        when(variantRepository.findById(200L)).thenReturn(Optional.of(mockVariant));
        when(quotationRepository.count()).thenReturn(0L);
        when(quotationRepository.save(any(Quotation.class))).thenAnswer(invocation -> {
            Quotation q = invocation.getArgument(0);
            q.setId(50L);
            return q;
        });

        QuotationItemDto itemDto = QuotationItemDto.builder()
                .productId(100L)
                .variantId(200L)
                .quantity(2)
                .taxRatePercent(new BigDecimal("18.00"))
                .build();

        QuotationRequest request = QuotationRequest.builder()
                .customerId(1L)
                .planId(10L)
                .items(List.of(itemDto))
                .build();

        QuotationResponse response = quotationService.createQuotation(request);

        assertNotNull(response);
        assertEquals(QuotationStatus.DRAFT, response.getStatus());
        // Unit price = 1000 + 560 = 1560
        // Line total = 1560 * 2 = 3120
        assertEquals(new BigDecimal("3120.00"), response.getSubtotal());
        // 18% tax of 3120 = 561.60
        assertEquals(new BigDecimal("561.60"), response.getTaxAmount());
        // Grand total = 3681.60
        assertEquals(new BigDecimal("3681.60"), response.getTotalAmount());
    }

    @Test
    void testConvertQuotationToSubscription() {
        QuotationItem item = QuotationItem.builder()
                .id(1L)
                .product(mockProduct)
                .variant(mockVariant)
                .quantity(2)
                .unitPrice(new BigDecimal("1560.00"))
                .taxRatePercent(new BigDecimal("18.00"))
                .lineTotal(new BigDecimal("3120.00"))
                .build();

        Quotation quotation = Quotation.builder()
                .id(50L)
                .quotationNumber("QUO-2026-0001")
                .customer(mockCustomer)
                .plan(mockPlan)
                .validUntil(LocalDate.now().plusDays(30))
                .status(QuotationStatus.CONFIRMED)
                .subtotal(new BigDecimal("3120.00"))
                .taxAmount(new BigDecimal("561.60"))
                .totalAmount(new BigDecimal("3681.60"))
                .items(new ArrayList<>(List.of(item)))
                .build();
        item.setQuotation(quotation);

        when(quotationRepository.findById(50L)).thenReturn(Optional.of(quotation));
        when(subscriptionRepository.count()).thenReturn(0L);
        when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(invocation -> {
            Subscription s = invocation.getArgument(0);
            s.setId(70L);
            return s;
        });

        SubscriptionResponse subResp = quotationService.convertToSubscription(50L);

        assertNotNull(subResp);
        assertEquals(SubscriptionStatus.ACTIVE, subResp.getStatus());
        assertEquals("SUB-" + LocalDate.now().getYear() + "-0001", subResp.getSubscriptionNumber());
        assertEquals(LocalDate.now().plusMonths(1), subResp.getNextBillingDate());
        assertEquals(QuotationStatus.CONVERTED, quotation.getStatus());
        assertEquals(1, subResp.getItems().size());
        assertEquals(new BigDecimal("1560.00"), subResp.getItems().get(0).getUnitPrice());
    }

    @Test
    void testSubscriptionPauseResumeCycle() {
        Subscription sub = Subscription.builder()
                .id(70L)
                .subscriptionNumber("SUB-2026-0001")
                .customer(mockCustomer)
                .plan(mockPlan)
                .status(SubscriptionStatus.ACTIVE)
                .startDate(LocalDate.now())
                .nextBillingDate(LocalDate.now().plusMonths(1))
                .items(new ArrayList<>())
                .build();

        when(subscriptionRepository.findById(70L)).thenReturn(Optional.of(sub));
        when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SubscriptionResponse paused = subscriptionService.pauseSubscription(70L);
        assertEquals(SubscriptionStatus.PAUSED, paused.getStatus());

        SubscriptionResponse resumed = subscriptionService.resumeSubscription(70L);
        assertEquals(SubscriptionStatus.ACTIVE, resumed.getStatus());
    }

    @Test
    void testPauseFailsWhenPlanDoesNotAllowPause() {
        Plan noPausePlan = Plan.builder()
                .id(11L)
                .name("No Pause Plan")
                .canPause(false)
                .build();

        Subscription sub = Subscription.builder()
                .id(71L)
                .plan(noPausePlan)
                .status(SubscriptionStatus.ACTIVE)
                .build();

        when(subscriptionRepository.findById(71L)).thenReturn(Optional.of(sub));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            subscriptionService.pauseSubscription(71L);
        });

        assertTrue(ex.getMessage().contains("does not permit pausing"));
    }

    @Test
    void testEarlyCloseSubscriptionWithReason() {
        Subscription sub = Subscription.builder()
                .id(72L)
                .subscriptionNumber("SUB-2026-0005")
                .customer(mockCustomer)
                .plan(mockPlan)
                .status(SubscriptionStatus.ACTIVE)
                .build();

        when(subscriptionRepository.findById(72L)).thenReturn(Optional.of(sub));
        when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SubscriptionResponse closed = subscriptionService.closeSubscription(72L, "Customer requested early termination");
        assertEquals(SubscriptionStatus.CLOSED, closed.getStatus());
        assertEquals(LocalDate.now(), closed.getExpiryDate());
    }

    @Test
    void testAutoCloseExpiredSubscriptionsSweep() {
        Plan expiredAutoClosePlan = Plan.builder()
                .id(15L)
                .name("Limited Promo Plan")
                .autoCloseOnEnd(true)
                .endDate(LocalDate.now().minusDays(1))
                .build();

        Subscription expiredSub = Subscription.builder()
                .id(80L)
                .subscriptionNumber("SUB-2026-EXPIRED")
                .plan(expiredAutoClosePlan)
                .status(SubscriptionStatus.ACTIVE)
                .expiryDate(LocalDate.now().minusDays(1))
                .build();

        Subscription stillActiveSub = Subscription.builder()
                .id(81L)
                .subscriptionNumber("SUB-2026-ACTIVE")
                .plan(mockPlan)
                .status(SubscriptionStatus.ACTIVE)
                .expiryDate(LocalDate.now().plusMonths(3))
                .build();

        when(subscriptionRepository.findByStatus(SubscriptionStatus.ACTIVE))
                .thenReturn(List.of(expiredSub, stillActiveSub));
        when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var result = subscriptionService.autoCloseExpiredSubscriptions();

        assertEquals(1, result.get("closedCount"));
        assertEquals(SubscriptionStatus.CLOSED, expiredSub.getStatus());
        assertEquals(SubscriptionStatus.ACTIVE, stillActiveSub.getStatus());
    }
}
