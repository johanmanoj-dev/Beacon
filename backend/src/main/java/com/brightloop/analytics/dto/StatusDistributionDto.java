package com.brightloop.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatusDistributionDto {
    private String status;
    private long count;
    private BigDecimal percentage;
    private String color;
}
