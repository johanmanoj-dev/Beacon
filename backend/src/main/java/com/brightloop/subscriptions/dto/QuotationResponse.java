package com.brightloop.subscriptions.dto;

import com.brightloop.subscriptions.Quotation;
import com.brightloop.subscriptions.QuotationStatus;
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
public class QuotationResponse {
    private Long id;
    private String quotationNumber;
    private Long customerId;
    private String customerName;
    private String customerEmail;
    private Long planId;
    private String planName;
    private String billingInterval;
    private LocalDate validUntil;
    private QuotationStatus status;
    private BigDecimal subtotal;
    private BigDecimal taxAmount;
    private BigDecimal totalAmount;
    private List<QuotationItemDto> items;
    private LocalDateTime createdAt;

    public static QuotationResponse fromEntity(Quotation q) {
        return QuotationResponse.builder()
                .id(q.getId())
                .quotationNumber(q.getQuotationNumber())
                .customerId(q.getCustomer() != null ? q.getCustomer().getId() : null)
                .customerName(q.getCustomer() != null ? q.getCustomer().getCompanyName() : null)
                .customerEmail(q.getCustomer() != null ? q.getCustomer().getContactEmail() : null)
                .planId(q.getPlan() != null ? q.getPlan().getId() : null)
                .planName(q.getPlan() != null ? q.getPlan().getName() : null)
                .billingInterval(q.getPlan() != null && q.getPlan().getBillingInterval() != null
                        ? q.getPlan().getBillingInterval().name() : null)
                .validUntil(q.getValidUntil())
                .status(q.getStatus())
                .subtotal(q.getSubtotal())
                .taxAmount(q.getTaxAmount())
                .totalAmount(q.getTotalAmount())
                .items(q.getItems() != null
                        ? q.getItems().stream().map(QuotationItemDto::fromEntity).collect(Collectors.toList())
                        : List.of())
                .createdAt(q.getCreatedAt())
                .build();
    }
}
