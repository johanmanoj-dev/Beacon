package com.brightloop.catalogue;

import com.brightloop.catalogue.dto.PlanRequest;
import com.brightloop.catalogue.dto.PlanResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PlanService {

    private final PlanRepository planRepository;

    @Transactional(readOnly = true)
    public List<PlanResponse> getAllPlans() {
        return planRepository.findAll().stream()
                .map(PlanResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PlanResponse getPlanById(Long id) {
        Plan plan = planRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Plan not found with id: " + id));
        return PlanResponse.fromEntity(plan);
    }

    @Transactional
    public PlanResponse createPlan(PlanRequest request) {
        validatePlanRequest(request);

        Plan plan = Plan.builder()
                .name(request.getName().trim())
                .billingInterval(request.getBillingInterval())
                .basePrice(request.getBasePrice())
                .minQuantity(request.getMinQuantity() != null ? request.getMinQuantity() : 1)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .autoCloseOnEnd(Boolean.TRUE.equals(request.getAutoCloseOnEnd()))
                .canPause(request.getCanPause() != null ? request.getCanPause() : true)
                .build();

        Plan saved = planRepository.save(plan);
        return PlanResponse.fromEntity(saved);
    }

    @Transactional
    public PlanResponse updatePlan(Long id, PlanRequest request) {
        validatePlanRequest(request);

        Plan plan = planRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Plan not found with id: " + id));

        plan.setName(request.getName().trim());
        plan.setBillingInterval(request.getBillingInterval());
        plan.setBasePrice(request.getBasePrice());
        plan.setMinQuantity(request.getMinQuantity() != null ? request.getMinQuantity() : 1);
        plan.setStartDate(request.getStartDate());
        plan.setEndDate(request.getEndDate());
        plan.setAutoCloseOnEnd(Boolean.TRUE.equals(request.getAutoCloseOnEnd()));
        plan.setCanPause(request.getCanPause() != null ? request.getCanPause() : true);

        Plan saved = planRepository.save(plan);
        return PlanResponse.fromEntity(saved);
    }

    private void validatePlanRequest(PlanRequest request) {
        if (request.getBasePrice() != null && request.getBasePrice().compareTo(java.math.BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Plan base price cannot be negative");
        }
        if (request.getMinQuantity() != null && request.getMinQuantity() < 1) {
            throw new IllegalArgumentException("Minimum quantity must be at least 1");
        }
        if (request.getStartDate() != null && request.getEndDate() != null && request.getStartDate().isAfter(request.getEndDate())) {
            throw new IllegalArgumentException("Plan start date cannot be after end date");
        }
    }

    @Transactional
    public void deletePlan(Long id) {
        if (!planRepository.existsById(id)) {
            throw new IllegalArgumentException("Plan not found with id: " + id);
        }
        planRepository.deleteById(id);
    }
}
