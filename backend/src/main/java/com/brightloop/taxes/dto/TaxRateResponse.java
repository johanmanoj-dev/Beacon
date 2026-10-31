package com.brightloop.taxes.dto;

import com.brightloop.taxes.TaxRate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaxRateResponse {

    private Long id;
    private String name;
    private BigDecimal ratePercent;
    private Boolean isActive;

    public static TaxRateResponse fromEntity(TaxRate taxRate) {
        return TaxRateResponse.builder()
                .id(taxRate.getId())
                .name(taxRate.getName())
                .ratePercent(taxRate.getRatePercent())
                .isActive(taxRate.getIsActive())
                .build();
    }
}
