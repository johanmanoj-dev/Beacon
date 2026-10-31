package com.brightloop.billing;

import com.brightloop.billing.dto.BillingRunRequest;
import com.brightloop.billing.dto.BillingRunResult;
import com.brightloop.catalogue.BillingInterval;
import com.brightloop.invoices.Invoice;
import com.brightloop.invoices.InvoiceItem;
import com.brightloop.invoices.InvoiceRepository;
import com.brightloop.invoices.InvoiceStatus;
import com.brightloop.subscriptions.Subscription;
import com.brightloop.subscriptions.SubscriptionItem;
import com.brightloop.subscriptions.SubscriptionRepository;
import com.brightloop.subscriptions.SubscriptionStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class BillingService {

    private final SubscriptionRepository subscriptionRepository;
    private final InvoiceRepository invoiceRepository;

    @Transactional
    public BillingRunResult executeBillingRun(BillingRunRequest request) {
        LocalDate targetDate = (request != null && request.getTargetDate() != null)
                ? request.getTargetDate()
                : LocalDate.now();

        boolean force = request != null && Boolean.TRUE.equals(request.getForce());
        Long specificSubId = request != null ? request.getSubscriptionId() : null;

        List<Subscription> eligibleSubscriptions;
        if (specificSubId != null) {
            var optSub = subscriptionRepository.findById(specificSubId);
            if (optSub.isPresent()) {
                Subscription s = optSub.get();
                if (!force && s.getNextBillingDate() != null && s.getNextBillingDate().isAfter(targetDate)) {
                    BillingRunResult result = BillingRunResult.builder()
                            .executionDate(LocalDate.now())
                            .targetCutoffDate(targetDate)
                            .totalSubscriptionsScanned(1)
                            .invoicesGenerated(0)
                            .invoicesSkipped(1)
                            .totalAmountBilled(BigDecimal.ZERO)
                            .generatedInvoiceNumbers(new ArrayList<>())
                            .messages(new ArrayList<>(Collections.singletonList("Skipped " + s.getSubscriptionNumber() + ": Next billing date " + s.getNextBillingDate() + " is after target cutoff " + targetDate)))
                            .build();
                    return result;
                }
                eligibleSubscriptions = Collections.singletonList(s);
            } else {
                eligibleSubscriptions = Collections.emptyList();
            }
        } else if (force) {
            eligibleSubscriptions = subscriptionRepository.findByStatus(SubscriptionStatus.ACTIVE);
        } else {
            eligibleSubscriptions = subscriptionRepository.findByNextBillingDateLessThanEqualAndStatus(
                    targetDate,
                    SubscriptionStatus.ACTIVE
            );
        }

        BillingRunResult result = BillingRunResult.builder()
                .executionDate(LocalDate.now())
                .targetCutoffDate(targetDate)
                .totalSubscriptionsScanned(eligibleSubscriptions.size())
                .invoicesGenerated(0)
                .invoicesSkipped(0)
                .totalAmountBilled(BigDecimal.ZERO)
                .generatedInvoiceNumbers(new ArrayList<>())
                .messages(new ArrayList<>())
                .build();

        long sequenceCounter = invoiceRepository.count() + 1;

        for (Subscription sub : eligibleSubscriptions) {
            try {
                if (sub.getStatus() != SubscriptionStatus.ACTIVE) {
                    result.setInvoicesSkipped(result.getInvoicesSkipped() + 1);
                    result.getMessages().add("Skipped " + sub.getSubscriptionNumber() + ": Status is " + sub.getStatus());
                    continue;
                }

                LocalDate periodStart = sub.getNextBillingDate() != null ? sub.getNextBillingDate() : targetDate;
                BillingInterval interval = (sub.getPlan() != null && sub.getPlan().getBillingInterval() != null)
                        ? sub.getPlan().getBillingInterval()
                        : BillingInterval.MONTHLY;

                LocalDate periodEnd = calculatePeriodEnd(periodStart, interval);

                // IDEMPOTENCY CHECK
                boolean alreadyBilled = invoiceRepository.existsBySubscriptionIdAndBillingPeriodStartAndBillingPeriodEnd(
                        sub.getId(),
                        periodStart,
                        periodEnd
                );

                if (alreadyBilled && !force) {
                    result.setInvoicesSkipped(result.getInvoicesSkipped() + 1);
                    result.getMessages().add("Skipped " + sub.getSubscriptionNumber() + ": Invoice already exists for cycle " + periodStart + " to " + periodEnd);
                    continue;
                }

                // Generate unique Invoice Number: INV-YYYYMM-XXXX
                String invoiceNumber = generateInvoiceNumber(periodStart, sequenceCounter++);
                while (invoiceRepository.findByInvoiceNumber(invoiceNumber).isPresent()) {
                    invoiceNumber = generateInvoiceNumber(periodStart, sequenceCounter++);
                }

                LocalDate dueDate = periodStart.plusDays(15);

                Invoice invoice = Invoice.builder()
                        .invoiceNumber(invoiceNumber)
                        .subscription(sub)
                        .customer(sub.getCustomer())
                        .billingPeriodStart(periodStart)
                        .billingPeriodEnd(periodEnd)
                        .issueDate(targetDate)
                        .dueDate(dueDate)
                        .status(InvoiceStatus.CONFIRMED)
                        .amountPaid(BigDecimal.ZERO)
                        .items(new ArrayList<>())
                        .build();

                List<SubscriptionItem> subItems = sub.getItems();
                if (subItems != null && !subItems.isEmpty()) {
                    for (SubscriptionItem sItem : subItems) {
                        String desc = sItem.getProduct() != null ? sItem.getProduct().getName() : "Subscription Item";
                        if (sItem.getVariant() != null && sItem.getVariant().getVariantName() != null) {
                            desc += " (" + sItem.getVariant().getVariantName() + ")";
                        }

                        InvoiceItem invItem = InvoiceItem.builder()
                                .description(desc)
                                .quantity(sItem.getQuantity() != null ? sItem.getQuantity() : 1)
                                .unitPrice(sItem.getUnitPrice() != null ? sItem.getUnitPrice() : BigDecimal.ZERO)
                                .taxRatePercent(sItem.getTaxRatePercent() != null ? sItem.getTaxRatePercent() : BigDecimal.valueOf(18.00))
                                .discountAmount(BigDecimal.ZERO)
                                .build();
                        invItem.calculateLine();
                        invoice.addItem(invItem);
                    }
                } else {
                    // Fallback to plan base price
                    BigDecimal basePrice = sub.getPlan() != null && sub.getPlan().getBasePrice() != null
                            ? sub.getPlan().getBasePrice()
                            : BigDecimal.valueOf(1000.00);

                    InvoiceItem invItem = InvoiceItem.builder()
                            .description(sub.getPlan() != null ? sub.getPlan().getName() : "Subscription Plan")
                            .quantity(1)
                            .unitPrice(basePrice)
                            .taxRatePercent(BigDecimal.valueOf(18.00))
                            .discountAmount(BigDecimal.ZERO)
                            .build();
                    invItem.calculateLine();
                    invoice.addItem(invItem);
                }

                invoice.recalculateTotals();
                invoiceRepository.save(invoice);

                // Advance Subscription nextBillingDate
                LocalDate nextBillingDate = calculateNextBillingDate(periodStart, interval);
                sub.setNextBillingDate(nextBillingDate);

                // Auto-close check if plan has autoCloseOnEnd and end date reached
                if (sub.getPlan() != null && Boolean.TRUE.equals(sub.getPlan().getAutoCloseOnEnd())) {
                    if (sub.getExpiryDate() != null && nextBillingDate.isAfter(sub.getExpiryDate())) {
                        sub.setStatus(SubscriptionStatus.CLOSED);
                        result.getMessages().add("Contract " + sub.getSubscriptionNumber() + " auto-closed upon reaching expiry date " + sub.getExpiryDate());
                    }
                }

                subscriptionRepository.save(sub);

                result.setInvoicesGenerated(result.getInvoicesGenerated() + 1);
                result.setTotalAmountBilled(result.getTotalAmountBilled().add(invoice.getTotalAmount()));
                result.getGeneratedInvoiceNumbers().add(invoiceNumber);
                result.getMessages().add("Generated invoice " + invoiceNumber + " for " + sub.getSubscriptionNumber() + " ($" + invoice.getTotalAmount() + ")");

            } catch (Exception e) {
                log.error("Failed to bill subscription {}: {}", sub.getSubscriptionNumber(), e.getMessage(), e);
                result.setInvoicesSkipped(result.getInvoicesSkipped() + 1);
                result.getMessages().add("Error billing " + sub.getSubscriptionNumber() + ": " + e.getMessage());
            }
        }

        return result;
    }

    private LocalDate calculatePeriodEnd(LocalDate start, BillingInterval interval) {
        return switch (interval) {
            case DAILY -> start;
            case WEEKLY -> start.plusWeeks(1).minusDays(1);
            case MONTHLY -> start.plusMonths(1).minusDays(1);
            case YEARLY -> start.plusYears(1).minusDays(1);
        };
    }

    private LocalDate calculateNextBillingDate(LocalDate start, BillingInterval interval) {
        return switch (interval) {
            case DAILY -> start.plusDays(1);
            case WEEKLY -> start.plusWeeks(1);
            case MONTHLY -> start.plusMonths(1);
            case YEARLY -> start.plusYears(1);
        };
    }

    private String generateInvoiceNumber(LocalDate date, long seq) {
        String ym = date.format(DateTimeFormatter.ofPattern("yyyyMM"));
        return String.format("INV-%s-%04d", ym, seq);
    }
}
