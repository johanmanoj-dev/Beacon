package com.brightloop.invoices;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Entity
@Table(name = "invoice_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    @JsonBackReference
    private Invoice invoice;

    @Column(nullable = false, length = 255)
    private String description;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "tax_rate_percent", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal taxRatePercent = BigDecimal.ZERO;

    @Column(name = "tax_amount", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "discount_amount", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "line_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal lineTotal;

    /**
     * Exact decimal line calculation:
     * subtotal = quantity * unitPrice
     * discount = discountAmount (fixed or preset)
     * taxable = max(0, subtotal - discount)
     * tax = taxable * (taxRatePercent / 100)
     * lineTotal = taxable + tax
     */
    public void calculateLine() {
        if (quantity == null || quantity <= 0) quantity = 1;
        if (unitPrice == null) unitPrice = BigDecimal.ZERO;
        if (taxRatePercent == null) taxRatePercent = BigDecimal.ZERO;
        if (discountAmount == null) discountAmount = BigDecimal.ZERO;

        BigDecimal base = unitPrice.multiply(BigDecimal.valueOf(quantity));
        BigDecimal afterDiscount = base.subtract(discountAmount).max(BigDecimal.ZERO);
        this.taxAmount = afterDiscount.multiply(taxRatePercent)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        this.lineTotal = afterDiscount.add(this.taxAmount);
    }
}
