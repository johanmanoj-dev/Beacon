package com.brightloop.billing;

import com.brightloop.billing.dto.BillingRunResponse;
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
        final LocalDate runDate = (targetDate != null) ? targetDate : LocalDate.now();
        log.info("Starting recurring billing run for target date: {}", runDate);

        List<Subscription> activeSubs = subscriptionRepository.findByStatus(SubscriptionStatus.ACTIVE);

        int createdCount = 0;
        int skippedCount = 0;
        BigDecimal totalBilled = BigDecimal.ZERO;
        List<String> generatedNumbers = new ArrayList<>();

        for (Subscription sub : activeSubs) {
            LocalDate nextBilling = sub.getNextBillingDate();
            if (nextBilling == null) {
                continue;
            }

            if (nextBilling.isAfter(runDate)) {
                // Check if this subscription was already invoiced for the cycle covering runDate
                boolean alreadyInvoicedForCycle = invoiceRepository.existsBySubscriptionIdAndBillingPeriodEnd(sub.getId(), nextBilling)
                        || invoiceRepository.findBySubscriptionId(sub.getId()).stream()
                                .anyMatch(inv -> inv.getBillingPeriodEnd() != null && !inv.getBillingPeriodEnd().isBefore(runDate));

                if (alreadyInvoicedForCycle) {
                    log.info("Idempotent skip: Subscription {} is already billed for cycle covering {}",
                            sub.getSubscriptionNumber(), runDate);
                    skippedCount++;
                }
                continue;
            }

            LocalDate periodStart = nextBilling;
            LocalDate periodEnd = computePeriodEnd(periodStart, sub.getPlan() != null ? sub.getPlan().getBillingInterval() : BillingInterval.MONTHLY);

            // 1. Strict Idempotency Check: cannot create multiple invoices for the same subscription period
            boolean alreadyInvoiced = invoiceRepository.existsBySubscriptionIdAndBillingPeriodStartAndBillingPeriodEnd(
                    sub.getId(), periodStart, periodEnd);

            if (alreadyInvoiced) {
                log.warn("IDEMPOTENCY TRIGGERED: Invoice already exists for subscription {} for period {} to {}. Skipping duplicate generation.",
                        sub.getSubscriptionNumber(), periodStart, periodEnd);
                skippedCount++;
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
                    .issueDate(runDate)
                    .dueDate(runDate.plusDays(15))
                    .amountPaid(BigDecimal.ZERO)
                    .status(InvoiceStatus.CONFIRMED)
                    .items(new ArrayList<>())
                    .build();

            int totalSeats = sub.getItems().stream().mapToInt(SubscriptionItem::getQuantity).sum();
            BigDecimal grossSubtotal = sub.getItems().stream()
                    .map(i -> i.getUnitPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal discountPercent = calculateApplicableDiscountPercent(runDate, grossSubtotal, totalSeats);

            BigDecimal subtotalAcc = BigDecimal.ZERO;
            BigDecimal discountAcc = BigDecimal.ZERO;
            BigDecimal taxAcc = BigDecimal.ZERO;

            for (SubscriptionItem item : sub.getItems()) {
                BigDecimal qty = BigDecimal.valueOf(item.getQuantity());
                BigDecimal lineSubtotal = item.getUnitPrice().multiply(qty).setScale(2, RoundingMode.HALF_UP);

                BigDecimal lineDiscount = BigDecimal.ZERO;
                if (discountPercent.compareTo(BigDecimal.ZERO) > 0) {
                    lineDiscount = lineSubtotal.multiply(discountPercent).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                }

                BigDecimal taxableAmount = lineSubtotal.subtract(lineDiscount);
                BigDecimal taxRate = (item.getTaxRatePercent() != null) ? item.getTaxRatePercent() : new BigDecimal("18.00");
                BigDecimal lineTax = taxableAmount.multiply(taxRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

                BigDecimal lineTotal = taxableAmount.add(lineTax).setScale(2, RoundingMode.HALF_UP);

                String desc = item.getProduct() != null ? item.getProduct().getName() : "Subscription Item";
                if (item.getVariant() != null) {
                    desc += " (" + item.getVariant().getVariantName() + ")";
                }

                InvoiceItem invoiceItem = InvoiceItem.builder()
                        .invoice(invoice)
                        .description(desc)
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
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

            BigDecimal totalAmount = subtotalAcc.subtract(discountAcc).add(taxAcc).setScale(2, RoundingMode.HALF_UP);

            invoice.setSubtotal(subtotalAcc);
            invoice.setDiscountAmount(discountAcc);
            invoice.setTaxAmount(taxAcc);
            invoice.setTotalAmount(totalAmount);
            invoice.setBalanceDue(totalAmount);

            Invoice savedInvoice = invoiceRepository.save(invoice);

            // 3. Advance next billing date on subscription
            sub.setNextBillingDate(periodEnd);
            subscriptionRepository.save(sub);

            createdCount++;
            totalBilled = totalBilled.add(totalAmount);
            generatedNumbers.add(savedInvoice.getInvoiceNumber());
            log.info("Generated invoice {} for subscription {} [Total: ${}]",
                    savedInvoice.getInvoiceNumber(), sub.getSubscriptionNumber(), totalAmount);
        }

        String msg = String.format("Billing run complete: %d invoices generated ($%s), %d skipped due to idempotency",
                createdCount, totalBilled.toPlainString(), skippedCount);

        return BillingRunResponse.builder()
                .runDate(runDate)
                .invoicesCreated(createdCount)
                .invoicesGenerated(createdCount)
                .invoicesSkipped(skippedCount)
                .skippedCount(skippedCount)
                .totalAmountBilled(totalBilled)
                .generatedInvoiceNumbers(generatedNumbers)
                .message(msg)
                .build();
    }

    private LocalDate computePeriodStart(LocalDate end, BillingInterval interval) {
        if (interval == null) interval = BillingInterval.MONTHLY;
        return switch (interval) {
            case DAILY -> end.minusDays(1);
            case WEEKLY -> end.minusWeeks(1);
            case MONTHLY -> end.minusMonths(1);
            case YEARLY -> end.minusYears(1);
        };
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

    private BigDecimal calculateApplicableDiscountPercent(LocalDate date, BigDecimal purchaseAmount, int totalQuantity) {
        // Look up active volume discount rule, e.g. "VOLUME10" or "VOL10"
        return discountRepository.findByCode("VOLUME10")
                .or(() -> discountRepository.findByCodeIgnoreCase("VOL10"))
                .or(() -> discountRepository.findByCode("VOL10"))
                .filter(d -> d.isValid(date, purchaseAmount, totalQuantity))
                .filter(d -> d.getDiscountType() == DiscountType.PERCENTAGE)
                .map(Discount::getValue)
                .orElse(BigDecimal.ZERO);
    }
}
