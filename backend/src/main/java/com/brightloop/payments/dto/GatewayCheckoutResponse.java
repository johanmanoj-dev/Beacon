package com.brightloop.payments.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GatewayCheckoutResponse {
    private String transactionId;
    private String idempotencyKey;
    private Long invoiceId;
    private String invoiceNumber;
    private String customerName;
    private BigDecimal amount;
    private String paymentMethod;
    private String status;
    private String message;
}
