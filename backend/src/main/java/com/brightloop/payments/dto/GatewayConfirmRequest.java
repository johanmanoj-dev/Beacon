package com.brightloop.payments.dto;

import com.brightloop.payments.PaymentAttemptStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GatewayConfirmRequest {

    @NotBlank(message = "Transaction ID is required")
    private String transactionId;

    private String idempotencyKey;

    @NotNull(message = "Simulated status is required")
    private PaymentAttemptStatus simulatedStatus;

    private String failureReason;
}
