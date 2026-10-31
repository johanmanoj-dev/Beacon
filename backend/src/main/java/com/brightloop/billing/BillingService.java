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

        List<Subscription> eligibleSubs = subscriptionRepository.findByStatus(SubscriptionStatus.ACTIVE)
                .stream()
                .filter(s -> s.getNextBillingDate() != null && !s.getNextBillingDate().isAfter(runDate))
                .toList();

        int createdCount = 0;
        int skippedCount = 0;
        BigDecimal totalBilled = BigDecimal.ZERO;
        List<String> generatedNumbers = new ArrayList<>();

        for (Subscription sub : eligibleSubs) {
            LocalDate periodStart = sub.getNextBillingDate();
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
            int totalQuantity = sub.getItems().stream().mapToInt(SubscriptionItem::getQuantity).sum();
            BigDecimal discountRate = calculateApplicableDiscountPercent(runDate, totalQuantity);

            BigDecimal subtotalAcc = BigDecimal.ZERO;
            BigDecimal discountAcc = BigDecimal.ZERO;
            BigDecimal taxAcc = BigDecimal.ZERO;

            for (SubscriptionItem item : sub.getItems()) {
                String desc = (item.getProduct() != null ? item.getProduct().getName() : "Subscription Item");
                if (item.getVariant() != null) {
                    desc += " (" + item.getVariant().getVariantName() + ")";
                }

                BigDecimal lineSubtotal = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()))
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
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice()) // Historical snapshot price preserved!
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
                .invoicesSkipped(skippedCount)
                .totalAmountBilled(totalBilled)
                .generatedInvoiceNumbers(generatedNumbers)
                .message(msg)
                .build();
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
