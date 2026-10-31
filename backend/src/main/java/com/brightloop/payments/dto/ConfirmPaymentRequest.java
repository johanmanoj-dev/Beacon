package com.brightloop.payments.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConfirmPaymentRequest {

    @NotBlank(message = "Transaction ID is required")
    private String transactionId;

    @Builder.Default
    private String simulatedOutcome = "SUCCESS"; // SUCCESS, FAILED

    private String paymentMethod;
}
