package com.brightloop.subscriptions;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuotationTemplateRepository extends JpaRepository<QuotationTemplate, Long> {
    List<QuotationTemplate> findAllByOrderByNameAsc();
    boolean existsByPlanId(Long planId);
}
