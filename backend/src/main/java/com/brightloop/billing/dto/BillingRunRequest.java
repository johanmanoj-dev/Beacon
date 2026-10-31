package com.brightloop.billing.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillingRunRequest {

    /**
     * Target billing execution cutoff date.
     * All active subscriptions with nextBillingDate <= targetDate will be billed.
     * Defaults to today if not provided.
     */
    private LocalDate targetDate;

    /**
     * Optional single subscription ID to bill on-demand.
     */
    private Long subscriptionId;

    /**
     * If true, generates invoices even if nextBillingDate is in the future.
     */
    @Builder.Default
    private Boolean force = false;
}
