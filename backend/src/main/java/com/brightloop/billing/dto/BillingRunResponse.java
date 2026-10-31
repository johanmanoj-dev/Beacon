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
public class BillingRunResponse {
    private LocalDate runDate;
    private int invoicesCreated;
    private int invoicesGenerated;
    private int invoicesSkipped;
    private int skippedCount;
    private BigDecimal totalAmountBilled;
    @Builder.Default
    private List<String> generatedInvoiceNumbers = new ArrayList<>();
    private String message;

    public int getInvoicesGenerated() {
        return invoicesCreated > 0 ? invoicesCreated : invoicesGenerated;
    }

    public int getInvoicesCreated() {
        return invoicesCreated > 0 ? invoicesCreated : invoicesGenerated;
    }

    public int getSkippedCount() {
        return invoicesSkipped > 0 ? invoicesSkipped : skippedCount;
    }

    public int getInvoicesSkipped() {
        return invoicesSkipped > 0 ? invoicesSkipped : skippedCount;
    }
}
