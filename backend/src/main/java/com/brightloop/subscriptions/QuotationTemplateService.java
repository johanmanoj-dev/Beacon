package com.brightloop.subscriptions;

import com.brightloop.catalogue.Plan;
import com.brightloop.catalogue.PlanRepository;
import com.brightloop.subscriptions.dto.QuotationTemplateDto;
import com.brightloop.subscriptions.dto.QuotationTemplateRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuotationTemplateService {

    private final QuotationTemplateRepository templateRepository;
    private final PlanRepository planRepository;

    @Transactional(readOnly = true)
    public List<QuotationTemplateDto> getAllTemplates() {
        return templateRepository.findAllByOrderByNameAsc().stream()
                .map(QuotationTemplateDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public QuotationTemplateDto getTemplateById(Long id) {
        QuotationTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Template not found with id: " + id));
        return QuotationTemplateDto.fromEntity(template);
    }

    @Transactional
    public QuotationTemplateDto createTemplate(QuotationTemplateRequest request) {
        Plan plan = planRepository.findById(request.getPlanId())
                .orElseThrow(() -> new IllegalArgumentException("Plan not found with id: " + request.getPlanId()));

        QuotationTemplate template = QuotationTemplate.builder()
                .name(request.getName().trim())
                .plan(plan)
                .validityDays(request.getValidityDays() != null ? request.getValidityDays() : 30)
                .notes(request.getNotes())
                .build();

        QuotationTemplate saved = templateRepository.save(template);
        return QuotationTemplateDto.fromEntity(saved);
    }

    @Transactional
    public void deleteTemplate(Long id) {
        if (!templateRepository.existsById(id)) {
            throw new IllegalArgumentException("Template not found with id: " + id);
        }
        templateRepository.deleteById(id);
    }
}
