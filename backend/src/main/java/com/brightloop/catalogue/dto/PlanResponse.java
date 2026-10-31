package com.brightloop.catalogue.dto;

import com.brightloop.catalogue.BillingInterval;
import com.brightloop.catalogue.Plan;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlanResponse {
    private Long id;
    private String name;
    private Long productId;
    private String productName;
    private BillingInterval billingInterval;
    private BigDecimal basePrice;
    private Integer minQuantity;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean autoCloseOnEnd;
    private Boolean canPause;
    private LocalDateTime createdAt;

    public static PlanResponse fromEntity(Plan plan) {
        return PlanResponse.builder()
                .id(plan.getId())
                .name(plan.getName())
                .productId(plan.getProduct() != null ? plan.getProduct().getId() : null)
                .productName(plan.getProduct() != null ? plan.getProduct().getName() : null)
                .billingInterval(plan.getBillingInterval())
                .basePrice(plan.getBasePrice())
                .minQuantity(plan.getMinQuantity())
                .startDate(plan.getStartDate())
                .endDate(plan.getEndDate())
                .autoCloseOnEnd(plan.getAutoCloseOnEnd())
                .canPause(plan.getCanPause())
                .createdAt(plan.getCreatedAt())
                .build();
    }
}
