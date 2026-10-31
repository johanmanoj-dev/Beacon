package com.brightloop.billing;

import com.brightloop.billing.dto.BillingRunResponse;
import com.brightloop.catalogue.BillingInterval;
import com.brightloop.discounts.Discount;
import com.brightloop.discounts.DiscountRepository;
import com.brightloop.discounts.DiscountType;
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
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class BillingService {

    private final SubscriptionRepository subscriptionRepository;
    private final InvoiceRepository invoiceRepository;
    private final DiscountRepository discountRepository;

    @Transactional
    public BillingRunResponse runBilling(LocalDate asOfDate) {
        if (asOfDate == null) {
            asOfDate = LocalDate.now();
        }

        log.info("Executing recurring billing engine as of date: {}", asOfDate);

        List<Subscription> activeSubscriptions = subscriptionRepository.findByStatus(SubscriptionStatus.ACTIVE);
        List<String> generatedInvoiceNumbers = new ArrayList<>();
        BigDecimal totalBilled = BigDecimal.ZERO;
        int generatedCount = 0;
        int skippedCount = 0;

        for (Subscription sub : activeSubscriptions) {
            LocalDate nextBilling = sub.getNextBillingDate();
            if (nextBilling == null || nextBilling.isAfter(asOfDate)) {
                continue;
            }

            LocalDate periodStart = nextBilling;
            LocalDate periodEnd = computePeriodEnd(periodStart, sub.getPlan().getBillingInterval());

            // 1. Idempotency Check: Verify no invoice exists for this subscription and period
            boolean alreadyBilled = invoiceRepository.existsBySubscriptionIdAndBillingPeriodStartAndBillingPeriodEnd(
                    sub.getId(), periodStart, periodEnd
            );

            if (alreadyBilled) {
                log.info("Idempotency match: Subscription {} is already billed for interval {} to {}. Skipping.",
                        sub.getSubscriptionNumber(), periodStart, periodEnd);
                skippedCount++;
                continue;
            }

            // 2. Generate unique sequential invoice number
            String invoiceNumber = generateNextInvoiceNumber();

            // 3. Compute Item Snapshots, Taxes & Subtotal
            BigDecimal subtotal = BigDecimal.ZERO;
            BigDecimal totalTax = BigDecimal.ZERO;
            int totalSeats = 0;
            List<InvoiceItem> invoiceItems = new ArrayList<>();

            for (SubscriptionItem item : sub.getItems()) {
                BigDecimal qty = BigDecimal.valueOf(item.getQuantity());
                BigDecimal lineSubtotal = item.getUnitPrice().multiply(qty).setScale(2, RoundingMode.HALF_UP);
                totalSeats += item.getQuantity();

                BigDecimal taxRate = item.getTaxRatePercent() != null ? item.getTaxRatePercent() : BigDecimal.ZERO;
                BigDecimal lineTax = lineSubtotal.multiply(taxRate)
                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

                subtotal = subtotal.add(lineSubtotal);
                totalTax = totalTax.add(lineTax);

                String description = item.getProduct().getName();
                if (item.getVariant() != null) {
                    description += " (" + item.getVariant().getVariantName() + ")";
                }

                InvoiceItem invItem = InvoiceItem.builder()
                        .description(description)
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .taxRatePercent(taxRate)
                        .taxAmount(lineTax)
                        .discountAmount(BigDecimal.ZERO)
                        .lineTotal(lineSubtotal.add(lineTax))
                        .build();

                invoiceItems.add(invItem);
            }

            // 4. Automated Promotional Discount Validation (e.g. VOL10 for >= 5 seats)
            BigDecimal discountAmount = BigDecimal.ZERO;
            if (totalSeats >= 5) {
                Optional<Discount> volDiscount = discountRepository.findByCodeIgnoreCase("VOL10");
                if (volDiscount.isPresent()) {
                    Discount d = volDiscount.get();
                    boolean isValid = (d.getStartDate() == null || !asOfDate.isBefore(d.getStartDate()))
                            && (d.getEndDate() == null || !asOfDate.isAfter(d.getEndDate()))
                            && (d.getUsageLimit() == null || d.getTimesUsed() == null || d.getTimesUsed() < d.getUsageLimit());

                    if (isValid) {
                        if (d.getDiscountType() == DiscountType.PERCENTAGE) {
                            discountAmount = subtotal.multiply(d.getValue())
                                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                        } else {
                            discountAmount = d.getValue().min(subtotal);
                        }
                        log.info("Applied volume discount {} of {} to invoice {}", d.getCode(), discountAmount, invoiceNumber);
                    }
                }
            }

            BigDecimal totalAmount = subtotal.add(totalTax).subtract(discountAmount).max(BigDecimal.ZERO);

            // 5. Construct and persist Invoice entity
            Invoice invoice = Invoice.builder()
                    .invoiceNumber(invoiceNumber)
                    .subscription(sub)
                    .customer(sub.getCustomer())
                    .billingPeriodStart(periodStart)
                    .billingPeriodEnd(periodEnd)
                    .issueDate(LocalDate.now())
                    .dueDate(LocalDate.now().plusDays(15))
                    .subtotal(subtotal)
                    .taxAmount(totalTax)
                    .discountAmount(discountAmount)
                    .totalAmount(totalAmount)
                    .amountPaid(BigDecimal.ZERO)
                    .balanceDue(totalAmount)
                    .status(InvoiceStatus.CONFIRMED)
                    .items(new ArrayList<>())
                    .build();

            for (InvoiceItem it : invoiceItems) {
                invoice.addItem(it);
            }

            invoiceRepository.saveAndFlush(invoice);
            generatedInvoiceNumbers.add(invoiceNumber);
            totalBilled = totalBilled.add(totalAmount);
            generatedCount++;

            // 6. Advance subscription next_billing_date to next cycle
            LocalDate advancedBillingDate = advanceBillingDate(periodStart, sub.getPlan().getBillingInterval());
            sub.setNextBillingDate(advancedBillingDate);
            subscriptionRepository.save(sub);

            log.info("Created recurring invoice {} for subscription {}. Next billing date advanced to {}",
                    invoiceNumber, sub.getSubscriptionNumber(), advancedBillingDate);
        }

        String msg = String.format("Recurring billing run finished: %d invoice(s) generated, %d skipped due to idempotency.",
                generatedCount, skippedCount);

        return BillingRunResponse.builder()
                .invoicesGenerated(generatedCount)
                .skippedCount(skippedCount)
                .totalAmountBilled(totalBilled)
                .generatedInvoiceNumbers(generatedInvoiceNumbers)
                .message(msg)
                .build();
    }

    private synchronized String generateNextInvoiceNumber() {
        long count = invoiceRepository.count() + 1;
        String candidate = String.format("INV-2026-%04d", count);
        while (invoiceRepository.findByInvoiceNumber(candidate).isPresent()) {
            count++;
            candidate = String.format("INV-2026-%04d", count);
        }
        return candidate;
    }

    private LocalDate computePeriodEnd(LocalDate start, BillingInterval interval) {
        if (interval == null) return start.plusMonths(1).minusDays(1);
        return switch (interval) {
            case YEARLY -> start.plusYears(1).minusDays(1);
            case WEEKLY -> start.plusWeeks(1).minusDays(1);
            case DAILY -> start;
            case MONTHLY -> start.plusMonths(1).minusDays(1);
        };
    }

    private LocalDate advanceBillingDate(LocalDate current, BillingInterval interval) {
        if (interval == null) return current.plusMonths(1);
        return switch (interval) {
            case YEARLY -> current.plusYears(1);
            case WEEKLY -> current.plusWeeks(1);
            case DAILY -> current.plusDays(1);
            case MONTHLY -> current.plusMonths(1);
        };
    }
}
