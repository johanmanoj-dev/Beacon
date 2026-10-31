package com.brightloop.taxes.dto;

import com.brightloop.taxes.TaxRate;
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
public class TaxRateDto {
    private Long id;

    @NotBlank(message = "Tax name is required")
    private String name;

    @NotNull(message = "Rate percent is required")
    @DecimalMin(value = "0.00", message = "Rate percent cannot be negative")
    private BigDecimal ratePercent;

    private Boolean isActive;

    public static TaxRateDto fromEntity(TaxRate entity) {
        if (entity == null) return null;
        return TaxRateDto.builder()
                .id(entity.getId())
                .name(entity.getName())
                .ratePercent(entity.getRatePercent())
                .isActive(entity.getIsActive())
                .build();
    }
}
