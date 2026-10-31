package com.brightloop.payments.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckoutSessionRequest {

    @NotNull(message = "Invoice ID is required")
    private Long invoiceId;

    @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
    private BigDecimal amount;

    private String paymentMethod; // e.g. UPI, CREDIT_CARD, NET_BANKING

    private String idempotencyKey;
}
