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
    private int invoicesSkipped;
    private BigDecimal totalAmountBilled;
    @Builder.Default
    private List<String> generatedInvoiceNumbers = new ArrayList<>();
    private String message;
}
