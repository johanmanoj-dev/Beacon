package com.brightloop.billing;

import com.brightloop.billing.dto.BillingRunRequest;
import com.brightloop.billing.dto.BillingRunResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/billing")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class BillingController {

    private final BillingService billingService;

    @PostMapping("/run")
    public ResponseEntity<BillingRunResult> runBilling(
            @RequestBody(required = false) BillingRunRequest request
    ) {
        if (request == null) {
            request = new BillingRunRequest();
        }
        BillingRunResult result = billingService.executeBillingRun(request);
        return ResponseEntity.ok(result);
    }
}
