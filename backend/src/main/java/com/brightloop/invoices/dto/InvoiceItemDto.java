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
public class InvoiceItemDto {
    private Long id;
    private String description;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal taxRatePercent;
    private BigDecimal taxAmount;
    private BigDecimal discountAmount;
    private BigDecimal lineTotal;

    public static InvoiceItemDto fromEntity(InvoiceItem entity) {
        if (entity == null) return null;
        return InvoiceItemDto.builder()
                .id(entity.getId())
                .description(entity.getDescription())
                .quantity(entity.getQuantity())
                .unitPrice(entity.getUnitPrice())
                .taxRatePercent(entity.getTaxRatePercent())
                .taxAmount(entity.getTaxAmount())
                .discountAmount(entity.getDiscountAmount())
                .lineTotal(entity.getLineTotal())
                .build();
    }
}
