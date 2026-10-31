package com.brightloop.subscriptions.dto;

import com.brightloop.subscriptions.Subscription;
import com.brightloop.subscriptions.SubscriptionStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionResponse {
    private Long id;
    private String subscriptionNumber;
    private Long customerId;
    private String customerName;
    private String customerEmail;
    private Long planId;
    private String planName;
    private String billingInterval;
    private Boolean canPause;
    private SubscriptionStatus status;
    private LocalDate startDate;
    private LocalDate expiryDate;
    private LocalDate nextBillingDate;
    private String paymentTerms;
    private BigDecimal subtotal;
    private BigDecimal taxAmount;
    private BigDecimal totalAmount;
    private List<SubscriptionItemDto> items;
    private LocalDateTime createdAt;

    public static SubscriptionResponse fromEntity(Subscription s) {
        BigDecimal subtotal = s.calculateSubtotal();
        BigDecimal taxAmount = s.calculateTaxTotal();
        BigDecimal totalAmount = s.calculateGrandTotal();

        return SubscriptionResponse.builder()
                .id(s.getId())
                .subscriptionNumber(s.getSubscriptionNumber())
                .customerId(s.getCustomer() != null ? s.getCustomer().getId() : null)
                .customerName(s.getCustomer() != null ? s.getCustomer().getCompanyName() : null)
                .customerEmail(s.getCustomer() != null ? s.getCustomer().getContactEmail() : null)
                .planId(s.getPlan() != null ? s.getPlan().getId() : null)
                .planName(s.getPlan() != null ? s.getPlan().getName() : null)
                .billingInterval(s.getPlan() != null && s.getPlan().getBillingInterval() != null
                        ? s.getPlan().getBillingInterval().name() : null)
                .canPause(s.getPlan() != null && Boolean.TRUE.equals(s.getPlan().getCanPause()))
                .status(s.getStatus())
                .startDate(s.getStartDate())
                .expiryDate(s.getExpiryDate())
                .nextBillingDate(s.getNextBillingDate())
                .paymentTerms(s.getPaymentTerms())
                .subtotal(subtotal)
                .taxAmount(taxAmount)
                .totalAmount(totalAmount)
                .items(s.getItems() != null
                        ? s.getItems().stream().map(SubscriptionItemDto::fromEntity).collect(Collectors.toList())
                        : List.of())
                .createdAt(s.getCreatedAt())
                .build();
    }
}
