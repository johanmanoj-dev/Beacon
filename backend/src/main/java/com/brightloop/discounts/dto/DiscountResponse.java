package com.brightloop.discounts.dto;

import com.brightloop.discounts.Discount;
import com.brightloop.discounts.DiscountScope;
import com.brightloop.discounts.DiscountType;
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
public class DiscountResponse {

    private Long id;
    private String code;
    private DiscountType discountType;
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
    private Boolean isValid;

    public static DiscountResponse fromEntity(Discount discount) {
        LocalDate today = LocalDate.now();
        boolean dateValid = (discount.getStartDate() == null || !today.isBefore(discount.getStartDate())) &&
                (discount.getEndDate() == null || !today.isAfter(discount.getEndDate()));
        boolean usageValid = discount.getUsageLimit() == null || discount.getTimesUsed() < discount.getUsageLimit();

        return DiscountResponse.builder()
                .id(discount.getId())
                .code(discount.getCode())
                .discountType(discount.getDiscountType())
                .value(discount.getValue())
                .minPurchaseAmount(discount.getMinPurchaseAmount() != null ? discount.getMinPurchaseAmount() : BigDecimal.ZERO)
                .minQuantity(discount.getMinQuantity() != null ? discount.getMinQuantity() : 1)
                .startDate(discount.getStartDate())
                .endDate(discount.getEndDate())
                .usageLimit(discount.getUsageLimit() != null ? discount.getUsageLimit() : 100)
                .timesUsed(discount.getTimesUsed() != null ? discount.getTimesUsed() : 0)
                .appliesTo(discount.getAppliesTo())
                .productId(discount.getProduct() != null ? discount.getProduct().getId() : null)
                .productName(discount.getProduct() != null ? discount.getProduct().getName() : null)
                .isValid(dateValid && usageValid)
                .build();
    }
}
