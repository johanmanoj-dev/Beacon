package com.brightloop.invoices;

import com.brightloop.customers.Customer;
import com.brightloop.subscriptions.Subscription;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "invoices",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_subscription_period", columnNames = {"subscription_id", "billing_period_start", "billing_period_end"})
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "invoice_number", nullable = false, unique = true, length = 50)
    private String invoiceNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subscription_id", nullable = false)
    private Subscription subscription;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "billing_period_start", nullable = false)
    private LocalDate billingPeriodStart;

    @Column(name = "billing_period_end", nullable = false)
    private LocalDate billingPeriodEnd;

    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Column(name = "tax_amount", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "discount_amount", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "amount_paid", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal amountPaid = BigDecimal.ZERO;

    @Column(name = "balance_due", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal balanceDue = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private InvoiceStatus status = InvoiceStatus.DRAFT;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    @Builder.Default
    private List<InvoiceItem> items = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (amountPaid == null) {
            amountPaid = BigDecimal.ZERO;
        }
        recalculateTotals();
    }

    public void addItem(InvoiceItem item) {
        items.add(item);
        item.setInvoice(this);
        recalculateTotals();
    }

    public void removeItem(InvoiceItem item) {
        items.remove(item);
        item.setInvoice(null);
        recalculateTotals();
    }

    /**
     * Exact decimal calculations summing all snapshot line items.
     * Preserves financial integrity with BigDecimal accuracy.
     */
    public void recalculateTotals() {
        BigDecimal sumSubtotal = BigDecimal.ZERO;
        BigDecimal sumTax = BigDecimal.ZERO;
        BigDecimal sumDiscount = BigDecimal.ZERO;
        BigDecimal sumTotal = BigDecimal.ZERO;

        for (InvoiceItem item : items) {
            item.calculateLine();
            BigDecimal lineBase = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            sumSubtotal = sumSubtotal.add(lineBase);
            sumTax = sumTax.add(item.getTaxAmount());
            sumDiscount = sumDiscount.add(item.getDiscountAmount());
            sumTotal = sumTotal.add(item.getLineTotal());
        }

        this.subtotal = sumSubtotal;
        this.taxAmount = sumTax;
        this.discountAmount = sumDiscount;
        this.totalAmount = sumTotal;

        if (this.amountPaid == null) {
            this.amountPaid = BigDecimal.ZERO;
        }
        this.balanceDue = this.totalAmount.subtract(this.amountPaid).max(BigDecimal.ZERO);

        updateStatusBasedOnBalance();
    }

    public void recordPayment(BigDecimal paymentAmount) {
        if (paymentAmount == null || paymentAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }
        if (this.amountPaid == null) {
            this.amountPaid = BigDecimal.ZERO;
        }
        this.amountPaid = this.amountPaid.add(paymentAmount);
        this.balanceDue = this.totalAmount.subtract(this.amountPaid).max(BigDecimal.ZERO);
        updateStatusBasedOnBalance();
    }

    private void updateStatusBasedOnBalance() {
        if (this.status == InvoiceStatus.CANCELLED) {
            return;
        }
        if (this.amountPaid.compareTo(BigDecimal.ZERO) > 0 && this.balanceDue.compareTo(BigDecimal.ZERO) == 0) {
            this.status = InvoiceStatus.PAID;
        } else if (this.amountPaid.compareTo(BigDecimal.ZERO) > 0 && this.balanceDue.compareTo(BigDecimal.ZERO) > 0) {
            this.status = InvoiceStatus.PARTIALLY_PAID;
        } else if (this.dueDate != null && LocalDate.now().isAfter(this.dueDate) && this.balanceDue.compareTo(BigDecimal.ZERO) > 0) {
            this.status = InvoiceStatus.OVERDUE;
        }
    }
}
