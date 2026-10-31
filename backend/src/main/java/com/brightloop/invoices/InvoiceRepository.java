package com.brightloop.invoices;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);
    List<Invoice> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    List<Invoice> findBySubscriptionIdOrderByBillingPeriodStartDesc(Long subscriptionId);
    List<Invoice> findByStatus(InvoiceStatus status);

    /**
     * Idempotency verification: ensures a subscription cannot be billed twice
     * for the same billing window.
     */
    boolean existsBySubscriptionIdAndBillingPeriodStartAndBillingPeriodEnd(
            Long subscriptionId,
            LocalDate billingPeriodStart,
            LocalDate billingPeriodEnd
    );
}
