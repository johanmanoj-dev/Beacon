package com.brightloop.payments;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentAttemptRepository extends JpaRepository<PaymentAttempt, Long> {
    Optional<PaymentAttempt> findByTransactionId(String transactionId);
    Optional<PaymentAttempt> findByIdempotencyKey(String idempotencyKey);
}
