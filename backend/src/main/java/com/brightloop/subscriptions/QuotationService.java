package com.brightloop.subscriptions;

import com.brightloop.catalogue.*;
import com.brightloop.customers.Customer;
import com.brightloop.customers.CustomerRepository;
import com.brightloop.subscriptions.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuotationService {

    private final QuotationRepository quotationRepository;
    private final QuotationTemplateRepository templateRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final CustomerRepository customerRepository;
    private final PlanRepository planRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;

    @Transactional(readOnly = true)
    public List<QuotationResponse> getAllQuotations(Long customerId) {
        List<Quotation> list;
        if (customerId != null) {
            list = quotationRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
        } else {
            list = quotationRepository.findAllByOrderByCreatedAtDesc();
        }
        return list.stream().map(QuotationResponse::fromEntity).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public QuotationResponse getQuotationById(Long id) {
        Quotation q = quotationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Quotation not found with id: " + id));
        return QuotationResponse.fromEntity(q);
    }

    @Transactional
    public QuotationResponse createQuotation(QuotationRequest request) {
        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new IllegalArgumentException("Customer not found with id: " + request.getCustomerId()));

        Plan plan = planRepository.findById(request.getPlanId())
                .orElseThrow(() -> new IllegalArgumentException("Plan not found with id: " + request.getPlanId()));

        LocalDate validUntil = request.getValidUntil();
        if (validUntil == null) {
            int days = 30;
            if (request.getTemplateId() != null) {
                var tmplOpt = templateRepository.findById(request.getTemplateId());
                if (tmplOpt.isPresent() && tmplOpt.get().getValidityDays() != null) {
                    days = tmplOpt.get().getValidityDays();
                }
            }
            validUntil = LocalDate.now().plusDays(days);
        }

        long count = quotationRepository.count() + 1;
        String quotationNumber = String.format("QUO-%d-%04d", LocalDate.now().getYear(), count);
        while (quotationRepository.findByQuotationNumber(quotationNumber).isPresent()) {
            count++;
            quotationNumber = String.format("QUO-%d-%04d", LocalDate.now().getYear(), count);
        }

        Quotation quotation = Quotation.builder()
                .quotationNumber(quotationNumber)
                .customer(customer)
                .plan(plan)
                .validUntil(validUntil)
                .status(QuotationStatus.DRAFT)
                .items(new ArrayList<>())
                .build();

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal taxTotal = BigDecimal.ZERO;

        int totalQuantity = 0;

        if (request.getItems() != null && !request.getItems().isEmpty()) {
            for (QuotationItemDto itemDto : request.getItems()) {
                Product product = productRepository.findById(itemDto.getProductId())
                        .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + itemDto.getProductId()));

                ProductVariant variant = null;
                if (itemDto.getVariantId() != null) {
                    variant = variantRepository.findById(itemDto.getVariantId())
                            .orElseThrow(() -> new IllegalArgumentException("Variant not found with id: " + itemDto.getVariantId()));
                }

                int qty = itemDto.getQuantity() != null && itemDto.getQuantity() > 0 ? itemDto.getQuantity() : 1;
                totalQuantity += qty;

                BigDecimal unitPrice = itemDto.getUnitPrice();
                if (unitPrice == null || unitPrice.compareTo(BigDecimal.ZERO) <= 0) {
                    unitPrice = product.getSalesPrice();
                    if (variant != null && variant.getPriceAdjustment() != null) {
                        unitPrice = unitPrice.add(variant.getPriceAdjustment());
                    }
                }

                BigDecimal taxRate = itemDto.getTaxRatePercent() != null ? itemDto.getTaxRatePercent() : new BigDecimal("18.00");
                BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(qty));
                BigDecimal itemTax = lineTotal.multiply(taxRate).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);

                subtotal = subtotal.add(lineTotal);
                taxTotal = taxTotal.add(itemTax);

                QuotationItem item = QuotationItem.builder()
                        .quotation(quotation)
                        .product(product)
                        .variant(variant)
                        .quantity(qty)
                        .unitPrice(unitPrice)
                        .taxRatePercent(taxRate)
                        .lineTotal(lineTotal)
                        .build();

                quotation.getItems().add(item);
            }
        } else {
            // Default plan base line item if no specific items provided
            BigDecimal planPrice = plan.getBasePrice() != null ? plan.getBasePrice() : BigDecimal.ZERO;
            int minQty = plan.getMinQuantity() != null ? plan.getMinQuantity() : 1;
            totalQuantity = minQty;
            BigDecimal lineTotal = planPrice.multiply(BigDecimal.valueOf(minQty));
            BigDecimal taxRate = new BigDecimal("18.00");
            BigDecimal itemTax = lineTotal.multiply(taxRate).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);

            subtotal = subtotal.add(lineTotal);
            taxTotal = taxTotal.add(itemTax);
        }

        if (plan.getMinQuantity() != null && totalQuantity < plan.getMinQuantity()) {
            throw new IllegalArgumentException(
                    String.format("Plan '%s' requires a minimum quantity of %d, but only %d provided",
                            plan.getName(), plan.getMinQuantity(), totalQuantity));
        }

        quotation.setSubtotal(subtotal);
        quotation.setTaxAmount(taxTotal);
        quotation.setTotalAmount(subtotal.add(taxTotal));

        Quotation saved = quotationRepository.save(quotation);
        return QuotationResponse.fromEntity(saved);
    }

    @Transactional
    public QuotationResponse updateStatus(Long id, QuotationStatus status) {
        Quotation q = quotationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Quotation not found with id: " + id));

        if (q.getStatus() == QuotationStatus.CONVERTED) {
            throw new IllegalStateException("Cannot change status of an already converted quotation");
        }

        q.setStatus(status);
        Quotation saved = quotationRepository.save(q);
        return QuotationResponse.fromEntity(saved);
    }

    @Transactional
    public SubscriptionResponse convertToSubscription(Long quotationId) {
        Quotation quotation = quotationRepository.findById(quotationId)
                .orElseThrow(() -> new IllegalArgumentException("Quotation not found with id: " + quotationId));

        if (quotation.getStatus() == QuotationStatus.CONVERTED) {
            throw new IllegalStateException("Quotation " + quotation.getQuotationNumber() + " has already been converted to a subscription");
        }

        LocalDate now = LocalDate.now();
        Plan plan = quotation.getPlan();

        LocalDate nextBillingDate;
        BillingInterval interval = plan.getBillingInterval() != null ? plan.getBillingInterval() : BillingInterval.MONTHLY;
        switch (interval) {
            case DAILY -> nextBillingDate = now.plusDays(1);
            case WEEKLY -> nextBillingDate = now.plusWeeks(1);
            case MONTHLY -> nextBillingDate = now.plusMonths(1);
            case YEARLY -> nextBillingDate = now.plusYears(1);
            default -> nextBillingDate = now.plusMonths(1);
        }

        long count = subscriptionRepository.count() + 1;
        String subNumber = String.format("SUB-%d-%04d", now.getYear(), count);
        while (subscriptionRepository.findBySubscriptionNumber(subNumber).isPresent()) {
            count++;
            subNumber = String.format("SUB-%d-%04d", now.getYear(), count);
        }

        Subscription subscription = Subscription.builder()
                .subscriptionNumber(subNumber)
                .customer(quotation.getCustomer())
                .plan(plan)
                .status(SubscriptionStatus.ACTIVE)
                .startDate(now)
                .expiryDate(plan.getEndDate())
                .nextBillingDate(nextBillingDate)
                .paymentTerms("Net 15")
                .items(new ArrayList<>())
                .build();

        for (QuotationItem qItem : quotation.getItems()) {
            SubscriptionItem sItem = SubscriptionItem.builder()
                    .subscription(subscription)
                    .product(qItem.getProduct())
                    .variant(qItem.getVariant())
                    .quantity(qItem.getQuantity())
                    .unitPrice(qItem.getUnitPrice())
                    .taxRatePercent(qItem.getTaxRatePercent())
                    .lineTotal(qItem.getLineTotal())
                    .build();

            subscription.getItems().add(sItem);
        }

        Subscription savedSubscription = subscriptionRepository.save(subscription);

        quotation.setStatus(QuotationStatus.CONVERTED);
        quotationRepository.save(quotation);

        return SubscriptionResponse.fromEntity(savedSubscription);
    }
}
