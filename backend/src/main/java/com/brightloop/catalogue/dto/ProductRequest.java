package com.brightloop.catalogue.dto;

import com.brightloop.catalogue.ProductType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductRequest {

    @NotBlank(message = "Product name is required")
    private String name;

    @NotNull(message = "Product type is required")
    private ProductType productType;

    @NotNull(message = "Sales price is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Sales price must be positive")
    private BigDecimal salesPrice;

    @NotNull(message = "Cost price is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Cost price must be positive")
    private BigDecimal costPrice;

    private String notes;

    @Builder.Default
    private List<ProductVariantDto> variants = new ArrayList<>();
}
