package com.brightloop.discounts;

import com.brightloop.catalogue.Product;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "discounts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Discount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false)
    private DiscountType discountType;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal value;

    @Column(name = "min_purchase_amount", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal minPurchaseAmount = BigDecimal.ZERO;

    @Column(name = "min_quantity")
    @Builder.Default
    private Integer minQuantity = 1;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "usage_limit")
    @Builder.Default
    private Integer usageLimit = 100;

    @Column(name = "times_used")
    @Builder.Default
    private Integer timesUsed = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "applies_to", nullable = false)
    private DiscountScope appliesTo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;
}
