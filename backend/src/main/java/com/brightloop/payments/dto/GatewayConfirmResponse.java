package com.brightloop.payments.dto;

import com.brightloop.invoices.InvoiceStatus;
import com.brightloop.payments.PaymentAttemptStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GatewayConfirmResponse {
    private String transactionId;
    private PaymentAttemptStatus status;
    private Long invoiceId;
    private String invoiceNumber;
    private BigDecimal amountPaid;
    private BigDecimal remainingBalance;
    private InvoiceStatus updatedInvoiceStatus;
    private String message;
}
