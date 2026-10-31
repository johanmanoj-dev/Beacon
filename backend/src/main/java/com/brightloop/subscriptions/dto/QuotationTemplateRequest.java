package com.brightloop.subscriptions.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuotationTemplateRequest {

    @NotBlank(message = "Template name cannot be blank")
    private String name;

    @NotNull(message = "Plan ID is required")
    private Long planId;

    @Builder.Default
    private Integer validityDays = 30;

    private String notes;
}
