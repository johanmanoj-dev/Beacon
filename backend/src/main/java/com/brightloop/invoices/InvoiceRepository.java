package com.brightloop.invoices;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);
    List<Invoice> findByCustomerId(Long customerId);
    List<Invoice> findByStatus(InvoiceStatus status);
    boolean existsBySubscriptionIdAndBillingPeriodStartAndBillingPeriodEnd(Long subscriptionId, LocalDate start, LocalDate end);
    Optional<Invoice> findFirstByOrderByCreatedAtDesc();
}
