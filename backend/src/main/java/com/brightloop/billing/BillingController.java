package com.brightloop.billing;

import com.brightloop.billing.dto.BillingRunRequest;
import com.brightloop.billing.dto.BillingRunResponse;
import com.brightloop.billing.dto.BillingRunResult;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/billing")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class BillingController {

    private final BillingService billingService;

    @PostMapping("/run")
    public ResponseEntity<BillingRunResponse> runBilling(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate targetDate,
            @RequestBody(required = false) BillingRunRequest request
    ) {
        LocalDate date = targetDate;
        if (date == null && request != null) {
            date = request.getTargetDate();
        }
        return ResponseEntity.ok(billingService.runBilling(date));
    }

    @PostMapping("/execute")
    public ResponseEntity<BillingRunResult> executeBilling(
            @RequestBody(required = false) BillingRunRequest request
    ) {
        if (request == null) {
            request = new BillingRunRequest();
        }
        return ResponseEntity.ok(billingService.executeBillingRun(request));
    }
}
