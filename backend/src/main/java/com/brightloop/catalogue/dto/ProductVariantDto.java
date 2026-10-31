package com.brightloop.catalogue.dto;

import com.brightloop.catalogue.ProductVariant;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductVariantDto {
    private Long id;

    @NotBlank(message = "Variant name is required")
    private String variantName;

    @NotNull(message = "Price adjustment is required")
    private BigDecimal priceAdjustment;

    public static ProductVariantDto fromEntity(ProductVariant pv) {
        return ProductVariantDto.builder()
                .id(pv.getId())
                .variantName(pv.getVariantName())
                .priceAdjustment(pv.getPriceAdjustment())
                .build();
    }
}
