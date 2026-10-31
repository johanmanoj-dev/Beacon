package com.brightloop.subscriptions.dto;

import com.brightloop.subscriptions.QuotationTemplate;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuotationTemplateDto {
    private Long id;
    private String name;
    private Long planId;
    private String planName;
    private String billingInterval;
    private Integer validityDays;
    private String notes;

    public static QuotationTemplateDto fromEntity(QuotationTemplate template) {
        return QuotationTemplateDto.builder()
                .id(template.getId())
                .name(template.getName())
                .planId(template.getPlan() != null ? template.getPlan().getId() : null)
                .planName(template.getPlan() != null ? template.getPlan().getName() : null)
                .billingInterval(template.getPlan() != null ? template.getPlan().getBillingInterval().name() : null)
                .validityDays(template.getValidityDays())
                .notes(template.getNotes())
                .build();
    }
}
