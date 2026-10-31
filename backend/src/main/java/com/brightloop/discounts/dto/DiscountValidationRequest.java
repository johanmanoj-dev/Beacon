package com.brightloop.discounts.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiscountValidationRequest {
    private String code;
    private BigDecimal amount;
    private Integer quantity;
    private Long productId;
}
