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
public class DiscountValidationResult {
    private boolean valid;
    private String message;
    private String code;
    private BigDecimal discountAmount;
    private BigDecimal finalAmount;
}
