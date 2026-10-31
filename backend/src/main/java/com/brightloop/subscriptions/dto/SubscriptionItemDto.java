package com.brightloop.subscriptions.dto;

import com.brightloop.subscriptions.SubscriptionItem;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionItemDto {
    private Long id;
    private Long productId;
    private String productName;
    private String productType;
    private Long variantId;
    private String variantName;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal taxRatePercent;
    private Long discountId;
    private BigDecimal lineTotal;

    public static SubscriptionItemDto fromEntity(SubscriptionItem item) {
        return SubscriptionItemDto.builder()
                .id(item.getId())
                .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                .productName(item.getProduct() != null ? item.getProduct().getName() : null)
                .productType(item.getProduct() != null ? item.getProduct().getProductType().name() : null)
                .variantId(item.getVariant() != null ? item.getVariant().getId() : null)
                .variantName(item.getVariant() != null ? item.getVariant().getVariantName() : null)
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .taxRatePercent(item.getTaxRatePercent())
                .discountId(item.getDiscountId())
                .lineTotal(item.getLineTotal())
                .build();
    }
}
