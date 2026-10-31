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
    private LocalDateTime createdAt;
    private List<InvoiceItemResponse> items;

    public static InvoiceResponse fromEntity(Invoice invoice) {
        return InvoiceResponse.builder()
                .id(invoice.getId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .subscriptionId(invoice.getSubscription() != null ? invoice.getSubscription().getId() : null)
                .subscriptionNumber(invoice.getSubscription() != null ? invoice.getSubscription().getSubscriptionNumber() : null)
                .customerId(invoice.getCustomer() != null ? invoice.getCustomer().getId() : null)
                .customerName(invoice.getCustomer() != null ? invoice.getCustomer().getCompanyName() : null)
                .billingPeriodStart(invoice.getBillingPeriodStart())
                .billingPeriodEnd(invoice.getBillingPeriodEnd())
                .issueDate(invoice.getIssueDate())
                .dueDate(invoice.getDueDate())
                .subtotal(invoice.getSubtotal())
                .taxAmount(invoice.getTaxAmount())
                .discountAmount(invoice.getDiscountAmount())
                .totalAmount(invoice.getTotalAmount())
                .amountPaid(invoice.getAmountPaid())
                .balanceDue(invoice.getBalanceDue())
                .status(invoice.getStatus())
                .createdAt(invoice.getCreatedAt())
                .items(invoice.getItems() != null ?
                        invoice.getItems().stream().map(InvoiceItemResponse::fromEntity).collect(Collectors.toList()) :
                        List.of())
                .build();
    }
}
