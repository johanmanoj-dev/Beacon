package com.brightloop.catalogue.dto;

import com.brightloop.catalogue.BillingInterval;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlanRequest {

    @NotBlank(message = "Plan name is required")
    private String name;

    private Long productId;

    @NotNull(message = "Billing interval is required")
    private BillingInterval billingInterval;

    @NotNull(message = "Base price is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Base price must be positive")
    private BigDecimal basePrice;

    @NotNull(message = "Minimum quantity is required")
    @Min(value = 1, message = "Minimum quantity must be at least 1")
    @Builder.Default
    private Integer minQuantity = 1;

    private LocalDate startDate;
    private LocalDate endDate;

    @Builder.Default
    private Boolean autoCloseOnEnd = false;

    @Builder.Default
    private Boolean canPause = true;
}
