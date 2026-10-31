package com.brightloop.billing;

import com.brightloop.billing.dto.BillingRunResponse;
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
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate asOfDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate targetDate
    ) {
        LocalDate date = asOfDate != null ? asOfDate : targetDate;
        return ResponseEntity.ok(billingService.runBilling(date));
    }
}
