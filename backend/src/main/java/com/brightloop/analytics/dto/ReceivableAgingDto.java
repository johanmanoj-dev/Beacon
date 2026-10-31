package com.brightloop.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReceivableAgingDto {
    private String invoiceNumber;
    private String customerName;
    private String contactEmail;
    private BigDecimal totalAmount;
    private BigDecimal balanceDue;
    private String dueDate;
    private int daysOverdue;
    private String status;
}
