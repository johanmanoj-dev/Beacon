package com.brightloop.taxes.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
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
public class TaxRateRequest {

    @NotBlank(message = "Tax rate name is required")
    private String name;

    @NotNull(message = "Rate percent is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Rate percent cannot be negative")
    @DecimalMax(value = "100.0", inclusive = true, message = "Rate percent cannot exceed 100%")
    private BigDecimal ratePercent;

    private Boolean isActive;
}
