package com.brightloop.billing;

import com.brightloop.billing.dto.BillingRunRequest;
import com.brightloop.billing.dto.BillingRunResponse;
import com.brightloop.billing.dto.BillingRunResult;
import com.brightloop.catalogue.BillingInterval;
import com.brightloop.discounts.Discount;
import com.brightloop.discounts.DiscountRepository;
import com.brightloop.discounts.DiscountType;
import com.brightloop.invoices.*;
import com.brightloop.subscriptions.Subscription;
import com.brightloop.subscriptions.SubscriptionItem;
import com.brightloop.subscriptions.SubscriptionRepository;
import com.brightloop.subscriptions.SubscriptionStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class BillingService {

    private final SubscriptionRepository subscriptionRepository;
    private final InvoiceRepository invoiceRepository;
    private final InvoiceService invoiceService;
    private final DiscountRepository discountRepository;

    @Transactional
    public BillingRunResponse runBilling(LocalDate targetDate) {
        LocalDate runDate = (targetDate != null) ? targetDate : LocalDate.now();
        BillingRunResult res = executeBillingRun(BillingRunRequest.builder()
                .targetDate(runDate)
                .force(false)
                .build());

        String msg = String.format("Billing run complete: %d invoices generated ($%s), %d skipped due to idempotency",
                res.getInvoicesGenerated(), res.getTotalAmountBilled().toPlainString(), res.getInvoicesSkipped());

        return BillingRunResponse.builder()
                .runDate(runDate)
                .invoicesCreated(res.getInvoicesGenerated())
                .invoicesSkipped(res.getInvoicesSkipped())
                .totalAmountBilled(res.getTotalAmountBilled())
                .generatedInvoiceNumbers(res.getGeneratedInvoiceNumbers())
                .message(msg)
                .build();
    }

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
                    return BillingRunResult.builder()
                            .executionDate(LocalDate.now())
                            .targetCutoffDate(targetDate)
                            .totalSubscriptionsScanned(1)
                            .invoicesGenerated(0)
                            .invoicesSkipped(1)
                            .totalAmountBilled(BigDecimal.ZERO)
                            .generatedInvoiceNumbers(new ArrayList<>())
                            .messages(new ArrayList<>(Collections.singletonList("Skipped " + s.getSubscriptionNumber() + ": Next billing date " + s.getNextBillingDate() + " is after target cutoff " + targetDate)))
                            .build();
                }
                eligibleSubscriptions = Collections.singletonList(s);
            } else {
                eligibleSubscriptions = Collections.emptyList();
            }
        } else if (force) {
            eligibleSubscriptions = subscriptionRepository.findByStatus(SubscriptionStatus.ACTIVE);
        } else {
            eligibleSubscriptions = subscriptionRepository.findByStatus(SubscriptionStatus.ACTIVE)
                    .stream()
                    .filter(s -> s.getNextBillingDate() != null && !s.getNextBillingDate().isAfter(targetDate))
                    .toList();
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

                LocalDate periodEnd = computePeriodEnd(periodStart, interval);

                // 1. Strict Idempotency Check: cannot create multiple invoices for the same subscription period
                boolean alreadyBilled = invoiceRepository.existsBySubscriptionIdAndBillingPeriodStartAndBillingPeriodEnd(
                        sub.getId(),
                        periodStart,
                        periodEnd
                );

                if (alreadyBilled && !force) {
                    log.warn("IDEMPOTENCY TRIGGERED: Invoice already exists for subscription {} for period {} to {}. Skipping duplicate generation.",
                            sub.getSubscriptionNumber(), periodStart, periodEnd);
                    result.setInvoicesSkipped(result.getInvoicesSkipped() + 1);
                    result.getMessages().add("Skipped " + sub.getSubscriptionNumber() + ": Invoice already exists for cycle " + periodStart + " to " + periodEnd);
                    continue;
                }

                // 2. Generate new invoice with frozen line item price snapshots
                String invoiceNumber = invoiceService.generateNextInvoiceNumber();
                Invoice invoice = Invoice.builder()
                        .invoiceNumber(invoiceNumber)
                        .subscription(sub)
                        .customer(sub.getCustomer())
                        .billingPeriodStart(periodStart)
                        .billingPeriodEnd(periodEnd)
                        .issueDate(targetDate)
                        .dueDate(targetDate.plusDays(15))
                        .subtotal(BigDecimal.ZERO)
                        .taxAmount(BigDecimal.ZERO)
                        .discountAmount(BigDecimal.ZERO)
                        .totalAmount(BigDecimal.ZERO)
                        .amountPaid(BigDecimal.ZERO)
                        .balanceDue(BigDecimal.ZERO)
                        .status(InvoiceStatus.CONFIRMED)
                        .items(new ArrayList<>())
                        .build();

                // Calculate total items quantity for volume discounts (e.g. Scene 5: >= 5 seats gets 10% volume discount)
                int totalQuantity = (sub.getItems() != null)
                        ? sub.getItems().stream().mapToInt(SubscriptionItem::getQuantity).sum()
                        : 0;
                BigDecimal discountRate = calculateApplicableDiscountPercent(targetDate, totalQuantity);

                BigDecimal subtotalAcc = BigDecimal.ZERO;
                BigDecimal discountAcc = BigDecimal.ZERO;
                BigDecimal taxAcc = BigDecimal.ZERO;

                if (sub.getItems() != null && !sub.getItems().isEmpty()) {
                    for (SubscriptionItem item : sub.getItems()) {
                        String desc = (item.getProduct() != null ? item.getProduct().getName() : "Subscription Item");
                        if (item.getVariant() != null && item.getVariant().getVariantName() != null) {
                            desc += " (" + item.getVariant().getVariantName() + ")";
                        }

                        BigDecimal unitPrice = item.getUnitPrice() != null ? item.getUnitPrice() : BigDecimal.ZERO;
                        int qty = item.getQuantity() != null ? item.getQuantity() : 1;

                        BigDecimal lineSubtotal = unitPrice.multiply(BigDecimal.valueOf(qty))
                                .setScale(2, RoundingMode.HALF_UP);

                        BigDecimal lineDiscount = BigDecimal.ZERO;
                        if (discountRate.compareTo(BigDecimal.ZERO) > 0) {
                            lineDiscount = lineSubtotal.multiply(discountRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                        }

                        BigDecimal taxableAmount = lineSubtotal.subtract(lineDiscount);
                        BigDecimal taxRate = item.getTaxRatePercent() != null ? item.getTaxRatePercent() : new BigDecimal("18.00");
                        BigDecimal lineTax = taxableAmount.multiply(taxRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

                        BigDecimal lineTotal = taxableAmount.add(lineTax).setScale(2, RoundingMode.HALF_UP);

                        InvoiceItem invoiceItem = InvoiceItem.builder()
                                .invoice(invoice)
                                .description(desc)
                                .quantity(qty)
                                .unitPrice(unitPrice) // Historical snapshot price preserved!
                                .taxRatePercent(taxRate)
                                .taxAmount(lineTax)
                                .discountAmount(lineDiscount)
                                .lineTotal(lineTotal)
                                .build();

                        invoice.getItems().add(invoiceItem);

                        subtotalAcc = subtotalAcc.add(lineSubtotal);
                        discountAcc = discountAcc.add(lineDiscount);
                        taxAcc = taxAcc.add(lineTax);
                    }
                } else {
                    // Fallback to plan base price
                    BigDecimal basePrice = sub.getPlan() != null && sub.getPlan().getBasePrice() != null
                            ? sub.getPlan().getBasePrice()
                            : BigDecimal.valueOf(1000.00);

                    BigDecimal taxRate = new BigDecimal("18.00");
                    BigDecimal lineTax = basePrice.multiply(taxRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                    BigDecimal lineTotal = basePrice.add(lineTax).setScale(2, RoundingMode.HALF_UP);

                    InvoiceItem invItem = InvoiceItem.builder()
                            .invoice(invoice)
                            .description(sub.getPlan() != null ? sub.getPlan().getName() : "Subscription Plan")
                            .quantity(1)
                            .unitPrice(basePrice)
                            .taxRatePercent(taxRate)
                            .taxAmount(lineTax)
                            .discountAmount(BigDecimal.ZERO)
                            .lineTotal(lineTotal)
                            .build();

                    invoice.getItems().add(invItem);
                    subtotalAcc = basePrice;
                    taxAcc = lineTax;
                }

                BigDecimal totalAmount = subtotalAcc.subtract(discountAcc).add(taxAcc).setScale(2, RoundingMode.HALF_UP);

                invoice.setSubtotal(subtotalAcc);
                invoice.setDiscountAmount(discountAcc);
                invoice.setTaxAmount(taxAcc);
                invoice.setTotalAmount(totalAmount);
                invoice.setBalanceDue(totalAmount);

                Invoice savedInvoice = invoiceRepository.save(invoice);

                // 3. Advance next billing date on subscription
                sub.setNextBillingDate(periodEnd);

                // Auto-close check if plan has autoCloseOnEnd and end date reached
                if (sub.getPlan() != null && Boolean.TRUE.equals(sub.getPlan().getAutoCloseOnEnd())) {
                    if (sub.getExpiryDate() != null && periodEnd.isAfter(sub.getExpiryDate())) {
                        sub.setStatus(SubscriptionStatus.CLOSED);
                        result.getMessages().add("Contract " + sub.getSubscriptionNumber() + " auto-closed upon reaching expiry date " + sub.getExpiryDate());
                    }
                }

                subscriptionRepository.save(sub);

                result.setInvoicesGenerated(result.getInvoicesGenerated() + 1);
                result.setTotalAmountBilled(result.getTotalAmountBilled().add(totalAmount));
                result.getGeneratedInvoiceNumbers().add(savedInvoice.getInvoiceNumber());
                result.getMessages().add("Generated invoice " + savedInvoice.getInvoiceNumber() + " for " + sub.getSubscriptionNumber() + " ($" + totalAmount + ")");

            } catch (Exception e) {
                log.error("Failed to bill subscription {}: {}", sub.getSubscriptionNumber(), e.getMessage(), e);
                result.setInvoicesSkipped(result.getInvoicesSkipped() + 1);
                result.getMessages().add("Error billing " + sub.getSubscriptionNumber() + ": " + e.getMessage());
            }
        }

        return result;
    }

    private LocalDate computePeriodEnd(LocalDate start, BillingInterval interval) {
        if (interval == null) interval = BillingInterval.MONTHLY;
        return switch (interval) {
            case DAILY -> start.plusDays(1);
            case WEEKLY -> start.plusWeeks(1);
            case MONTHLY -> start.plusMonths(1);
            case YEARLY -> start.plusYears(1);
        };
    }

    private BigDecimal calculateApplicableDiscountPercent(LocalDate date, int totalQuantity) {
        // Look up active volume discount rule, e.g. "VOLUME10" or "VOL10"
        return discountRepository.findByCode("VOLUME10")
                .or(() -> discountRepository.findByCode("VOL10"))
                .filter(d -> d.isValid(date, BigDecimal.ZERO, totalQuantity))
                .filter(d -> d.getDiscountType() == DiscountType.PERCENTAGE)
                .map(Discount::getValue)
                .orElse(BigDecimal.ZERO);
    }
}
