package com.brightloop.payments;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByInvoiceIdOrderByPaymentDateDesc(Long invoiceId);
    List<Payment> findAllByOrderByPaymentDateDesc();
}
