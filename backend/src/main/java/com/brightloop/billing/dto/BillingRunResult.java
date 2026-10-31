package com.brightloop.billing.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillingRunResult {

    private LocalDate executionDate;
    private LocalDate targetCutoffDate;
    private int totalSubscriptionsScanned;
    private int invoicesGenerated;
    private int invoicesSkipped;

    @Builder.Default
    private BigDecimal totalAmountBilled = BigDecimal.ZERO;

    @Builder.Default
    private List<String> generatedInvoiceNumbers = new ArrayList<>();

    @Builder.Default
    private List<String> messages = new ArrayList<>();
}
