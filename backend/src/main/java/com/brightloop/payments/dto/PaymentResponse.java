package com.brightloop.payments.dto;

import com.brightloop.invoices.InvoiceStatus;
import com.brightloop.payments.Payment;
import com.brightloop.payments.PaymentMethod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {

    private Long id;
    private Long invoiceId;
    private String invoiceNumber;
    private String customerName;
    private BigDecimal amount;
    private PaymentMethod paymentMethod;
    private String referenceNumber;
    private LocalDateTime paymentDate;
    private String notes;
    private Long recordedBy;
    private String recordedByName;
    private BigDecimal remainingBalanceDue;
    private InvoiceStatus updatedInvoiceStatus;
    private LocalDateTime createdAt;

    public static PaymentResponse fromEntity(Payment payment) {
        if (payment == null) return null;
        return PaymentResponse.builder()
                .id(payment.getId())
                .invoiceId(payment.getInvoice() != null ? payment.getInvoice().getId() : null)
                .invoiceNumber(payment.getInvoice() != null ? payment.getInvoice().getInvoiceNumber() : null)
                .customerName(payment.getInvoice() != null && payment.getInvoice().getCustomer() != null
                        ? payment.getInvoice().getCustomer().getCompanyName() : null)
                .amount(payment.getAmount())
                .paymentMethod(payment.getPaymentMethod())
                .referenceNumber(payment.getReferenceNumber())
                .paymentDate(payment.getPaymentDate())
                .notes(payment.getNotes())
                .recordedBy(payment.getRecordedBy() != null ? payment.getRecordedBy().getId() : null)
                .recordedByName(payment.getRecordedBy() != null ? payment.getRecordedBy().getFullName() : "Self-Service Customer")
                .remainingBalanceDue(payment.getInvoice() != null ? payment.getInvoice().getBalanceDue() : null)
                .updatedInvoiceStatus(payment.getInvoice() != null ? payment.getInvoice().getStatus() : null)
                .createdAt(payment.getCreatedAt())
                .build();
    }
}
