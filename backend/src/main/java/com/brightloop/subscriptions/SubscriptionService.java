package com.brightloop.subscriptions;

import com.brightloop.catalogue.BillingInterval;
import com.brightloop.catalogue.Plan;
import com.brightloop.subscriptions.dto.SubscriptionResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;

    @Transactional(readOnly = true)
    public List<SubscriptionResponse> getAllSubscriptions(String statusStr, Long customerId, Long planId) {
        List<Subscription> list;
        if (customerId != null) {
            list = subscriptionRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
        } else {
            list = subscriptionRepository.findAllByOrderByCreatedAtDesc();
        }

        if (planId != null) {
            list = list.stream()
                    .filter(s -> s.getPlan() != null && planId.equals(s.getPlan().getId()))
                    .collect(Collectors.toList());
        }

        if (statusStr != null && !statusStr.isBlank() && !"ALL".equalsIgnoreCase(statusStr.trim())) {
            try {
                SubscriptionStatus status = SubscriptionStatus.valueOf(statusStr.trim().toUpperCase());
                list = list.stream().filter(s -> s.getStatus() == status).collect(Collectors.toList());
            } catch (IllegalArgumentException ignored) {}
        }

        return list.stream().map(SubscriptionResponse::fromEntity).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SubscriptionResponse getSubscriptionById(Long id) {
        Subscription s = subscriptionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Subscription not found with id: " + id));
        return SubscriptionResponse.fromEntity(s);
    }

    @Transactional
    public SubscriptionResponse pauseSubscription(Long id) {
        Subscription s = subscriptionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Subscription not found with id: " + id));

        if (s.getStatus() == SubscriptionStatus.CLOSED) {
            throw new IllegalStateException("Cannot pause a closed subscription");
        }

        if (s.getPlan() != null && Boolean.FALSE.equals(s.getPlan().getCanPause())) {
            throw new IllegalStateException("The plan '" + s.getPlan().getName() + "' does not permit pausing subscriptions");
        }

        s.setStatus(SubscriptionStatus.PAUSED);
        Subscription saved = subscriptionRepository.save(s);
        return SubscriptionResponse.fromEntity(saved);
    }

    @Transactional
    public SubscriptionResponse resumeSubscription(Long id) {
        Subscription s = subscriptionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Subscription not found with id: " + id));

        if (s.getStatus() == SubscriptionStatus.CLOSED) {
            throw new IllegalStateException("Cannot resume a closed subscription");
        }

        s.setStatus(SubscriptionStatus.ACTIVE);
        Subscription saved = subscriptionRepository.save(s);
        return SubscriptionResponse.fromEntity(saved);
    }

    @Transactional
    public SubscriptionResponse closeSubscription(Long id, String reason) {
        Subscription s = subscriptionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Subscription not found with id: " + id));

        if (s.getStatus() == SubscriptionStatus.CLOSED) {
            throw new IllegalStateException("Subscription is already closed");
        }

        log.info("Closing subscription {} early. Reason: {}", s.getSubscriptionNumber(), reason != null ? reason : "Customer/Admin request");
        s.setStatus(SubscriptionStatus.CLOSED);
        s.setExpiryDate(LocalDate.now());
        Subscription saved = subscriptionRepository.save(s);
        return SubscriptionResponse.fromEntity(saved);
    }

    @Transactional
    public SubscriptionResponse renewSubscription(Long id) {
        Subscription s = subscriptionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Subscription not found with id: " + id));

        Plan plan = s.getPlan();
        BillingInterval interval = plan != null && plan.getBillingInterval() != null
                ? plan.getBillingInterval()
                : BillingInterval.MONTHLY;

        LocalDate baseDate = s.getNextBillingDate() != null ? s.getNextBillingDate() : LocalDate.now();
        LocalDate nextDate;
        switch (interval) {
            case DAILY -> nextDate = baseDate.plusDays(1);
            case WEEKLY -> nextDate = baseDate.plusWeeks(1);
            case MONTHLY -> nextDate = baseDate.plusMonths(1);
            case YEARLY -> nextDate = baseDate.plusYears(1);
            default -> nextDate = baseDate.plusMonths(1);
        }

        s.setNextBillingDate(nextDate);
        s.setStatus(SubscriptionStatus.ACTIVE);
        Subscription saved = subscriptionRepository.save(s);
        return SubscriptionResponse.fromEntity(saved);
    }

    @Transactional
    public Map<String, Object> autoCloseExpiredSubscriptions() {
        LocalDate today = LocalDate.now();
        List<Subscription> activeSubs = subscriptionRepository.findByStatus(SubscriptionStatus.ACTIVE);
        List<String> closedSubNumbers = new ArrayList<>();

        for (Subscription sub : activeSubs) {
            boolean shouldClose = false;

            // 1. Check if contract explicit expiry date reached
            if (sub.getExpiryDate() != null && !sub.getExpiryDate().isAfter(today)) {
                shouldClose = true;
            }

            // 2. Check if plan autoCloseOnEnd is enabled and plan end date reached
            Plan plan = sub.getPlan();
            if (plan != null && Boolean.TRUE.equals(plan.getAutoCloseOnEnd()) && plan.getEndDate() != null) {
                if (!plan.getEndDate().isAfter(today)) {
                    shouldClose = true;
                }
            }

            if (shouldClose) {
                sub.setStatus(SubscriptionStatus.CLOSED);
                sub.setExpiryDate(today);
                subscriptionRepository.save(sub);
                closedSubNumbers.add(sub.getSubscriptionNumber());
                log.info("Auto-closed expired subscription {} based on lifecycle rule", sub.getSubscriptionNumber());
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("checkedCount", activeSubs.size());
        result.put("closedCount", closedSubNumbers.size());
        result.put("closedSubscriptions", closedSubNumbers);
        result.put("message", String.format("Auto-close sweep completed. %d of %d active subscriptions closed.",
                closedSubNumbers.size(), activeSubs.size()));
        return result;
    }
}
