package com.brightloop.subscriptions;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuotationRepository extends JpaRepository<Quotation, Long> {
    List<Quotation> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    List<Quotation> findAllByOrderByCreatedAtDesc();
    Optional<Quotation> findByQuotationNumber(String quotationNumber);
    boolean existsByPlanId(Long planId);
    long count();
}
