package com.brightloop.subscriptions;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    List<Subscription> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    List<Subscription> findAllByOrderByCreatedAtDesc();
    List<Subscription> findByStatus(SubscriptionStatus status);
    List<Subscription> findByNextBillingDateLessThanEqualAndStatus(LocalDate date, SubscriptionStatus status);
    Optional<Subscription> findBySubscriptionNumber(String subscriptionNumber);
    boolean existsByPlanId(Long planId);
    long countByStatus(SubscriptionStatus status);
    long count();
}
