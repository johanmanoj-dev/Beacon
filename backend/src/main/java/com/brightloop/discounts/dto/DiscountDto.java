package com.brightloop.discounts.dto;

import com.brightloop.discounts.Discount;
import com.brightloop.discounts.DiscountScope;
import com.brightloop.discounts.DiscountType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiscountDto {
    private Long id;

    @NotBlank(message = "Discount code is required")
    private String code;

    @NotNull(message = "Discount type is required")
    private DiscountType discountType;

    @NotNull(message = "Discount value is required")
    @DecimalMin(value = "0.01", message = "Discount value must be greater than zero")
    private BigDecimal value;

    private BigDecimal minPurchaseAmount;
    private Integer minQuantity;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer usageLimit;
    private Integer timesUsed;
    private DiscountScope appliesTo;
    private Long productId;
    private String productName;

    public static DiscountDto fromEntity(Discount entity) {
        if (entity == null) return null;
        return DiscountDto.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .discountType(entity.getDiscountType())
                .value(entity.getValue())
                .minPurchaseAmount(entity.getMinPurchaseAmount())
                .minQuantity(entity.getMinQuantity())
                .startDate(entity.getStartDate())
                .endDate(entity.getEndDate())
                .usageLimit(entity.getUsageLimit())
                .timesUsed(entity.getTimesUsed())
                .appliesTo(entity.getAppliesTo())
                .productId(entity.getProduct() != null ? entity.getProduct().getId() : null)
                .productName(entity.getProduct() != null ? entity.getProduct().getName() : null)
                .build();
    }
}
