package com.brightloop.invoices.dto;

import com.brightloop.invoices.InvoiceItem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceItemResponse {
    private Long id;
    private String description;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal taxRatePercent;
    private BigDecimal taxAmount;
    private BigDecimal discountAmount;
    private BigDecimal lineTotal;

    public static InvoiceItemResponse fromEntity(InvoiceItem item) {
        return InvoiceItemResponse.builder()
                .id(item.getId())
                .description(item.getDescription())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .taxRatePercent(item.getTaxRatePercent())
                .taxAmount(item.getTaxAmount())
                .discountAmount(item.getDiscountAmount())
                .lineTotal(item.getLineTotal())
                .build();
    }
}
