package com.brightloop.catalogue.dto;

import com.brightloop.catalogue.Product;
import com.brightloop.catalogue.ProductType;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductResponse {
    private Long id;
    private String name;
    private ProductType productType;
    private BigDecimal salesPrice;
    private BigDecimal costPrice;
    private String notes;
    private List<ProductVariantDto> variants;
    private LocalDateTime createdAt;

    public static ProductResponse fromEntity(Product p) {
        return ProductResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .productType(p.getProductType())
                .salesPrice(p.getSalesPrice())
                .costPrice(p.getCostPrice())
                .notes(p.getNotes())
                .variants(p.getVariants() != null
                        ? p.getVariants().stream().map(ProductVariantDto::fromEntity).collect(Collectors.toList())
                        : List.of())
                .createdAt(p.getCreatedAt())
                .build();
    }
}
