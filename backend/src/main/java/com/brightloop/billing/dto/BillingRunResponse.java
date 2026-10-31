package com.brightloop.billing.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillingRunResponse {
    private int invoicesGenerated;
    private int skippedCount;
    private BigDecimal totalAmountBilled;
    private List<String> generatedInvoiceNumbers;
    private String message;
}
