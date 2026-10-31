package com.brightloop.subscriptions.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuotationRequest {

    @NotNull(message = "Customer ID is required")
    private Long customerId;

    @NotNull(message = "Plan ID is required")
    private Long planId;

    private Long templateId;

    private LocalDate validUntil;

    @Builder.Default
    private List<QuotationItemDto> items = new ArrayList<>();
}
