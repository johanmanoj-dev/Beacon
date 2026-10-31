package com.brightloop.invoices.dto;

import com.brightloop.invoices.Invoice;
import com.brightloop.invoices.InvoiceStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceResponse {
    private Long id;
    private String invoiceNumber;
    private Long subscriptionId;
    private String subscriptionNumber;
    private Long customerId;
    private String customerName;
    private LocalDate billingPeriodStart;
    private LocalDate billingPeriodEnd;
    private LocalDate issueDate;
    private LocalDate dueDate;
    private BigDecimal subtotal;
    private BigDecimal taxAmount;
    private BigDecimal discountAmount;
    private BigDecimal totalAmount;
    private BigDecimal amountPaid;
    private BigDecimal balanceDue;
    private InvoiceStatus status;
    private List<InvoiceItemDto> items;
    private LocalDateTime createdAt;

    public static InvoiceResponse fromEntity(Invoice entity) {
        if (entity == null) return null;
        return InvoiceResponse.builder()
                .id(entity.getId())
                .invoiceNumber(entity.getInvoiceNumber())
                .subscriptionId(entity.getSubscription() != null ? entity.getSubscription().getId() : null)
                .subscriptionNumber(entity.getSubscription() != null ? entity.getSubscription().getSubscriptionNumber() : null)
                .customerId(entity.getCustomer() != null ? entity.getCustomer().getId() : null)
                .customerName(entity.getCustomer() != null ? entity.getCustomer().getCompanyName() : null)
                .billingPeriodStart(entity.getBillingPeriodStart())
                .billingPeriodEnd(entity.getBillingPeriodEnd())
                .issueDate(entity.getIssueDate())
                .dueDate(entity.getDueDate())
                .subtotal(entity.getSubtotal())
                .taxAmount(entity.getTaxAmount())
                .discountAmount(entity.getDiscountAmount())
                .totalAmount(entity.getTotalAmount())
                .amountPaid(entity.getAmountPaid())
                .balanceDue(entity.getBalanceDue())
                .status(entity.getStatus())
                .items(entity.getItems() != null
                        ? entity.getItems().stream().map(InvoiceItemDto::fromEntity).collect(Collectors.toList())
                        : new ArrayList<>())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
