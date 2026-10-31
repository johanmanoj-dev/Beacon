package com.brightloop.payments.dto;

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
    private LocalDateTime createdAt;

    public static PaymentResponse fromEntity(Payment entity) {
        if (entity == null) return null;
        return PaymentResponse.builder()
                .id(entity.getId())
                .invoiceId(entity.getInvoice() != null ? entity.getInvoice().getId() : null)
                .invoiceNumber(entity.getInvoice() != null ? entity.getInvoice().getInvoiceNumber() : null)
                .customerName(entity.getInvoice() != null && entity.getInvoice().getCustomer() != null
                        ? entity.getInvoice().getCustomer().getCompanyName() : null)
                .amount(entity.getAmount())
                .paymentMethod(entity.getPaymentMethod())
                .referenceNumber(entity.getReferenceNumber())
                .paymentDate(entity.getPaymentDate())
                .notes(entity.getNotes())
                .recordedBy(entity.getRecordedBy() != null ? entity.getRecordedBy().getId() : null)
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
