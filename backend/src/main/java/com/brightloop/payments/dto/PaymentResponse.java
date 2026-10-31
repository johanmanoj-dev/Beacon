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
    private String recordedByName;
    private BigDecimal remainingBalanceDue;
    private InvoiceStatus updatedInvoiceStatus;

    public static PaymentResponse fromEntity(Payment payment) {
        return PaymentResponse.builder()
                .id(payment.getId())
                .invoiceId(payment.getInvoice().getId())
                .invoiceNumber(payment.getInvoice().getInvoiceNumber())
                .customerName(payment.getInvoice().getCustomer() != null ? payment.getInvoice().getCustomer().getCompanyName() : null)
                .amount(payment.getAmount())
                .paymentMethod(payment.getPaymentMethod())
                .referenceNumber(payment.getReferenceNumber())
                .paymentDate(payment.getPaymentDate())
                .notes(payment.getNotes())
                .recordedByName(payment.getRecordedBy() != null ? payment.getRecordedBy().getFullName() : "Self-Service Customer")
                .remainingBalanceDue(payment.getInvoice().getBalanceDue())
                .updatedInvoiceStatus(payment.getInvoice().getStatus())
                .build();
    }
}
