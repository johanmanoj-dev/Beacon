package com.brightloop.subscriptions;

import com.brightloop.subscriptions.dto.QuotationRequest;
import com.brightloop.subscriptions.dto.QuotationResponse;
import com.brightloop.subscriptions.dto.SubscriptionResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/quotations")
@RequiredArgsConstructor
public class QuotationController {

    private final QuotationService quotationService;

    @GetMapping
    public ResponseEntity<List<QuotationResponse>> getAllQuotations(@RequestParam(required = false) Long customerId) {
        return ResponseEntity.ok(quotationService.getAllQuotations(customerId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getQuotationById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(quotationService.getQuotationById(id));
        } catch (IllegalArgumentException e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Not Found");
            err.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
        }
    }

    @PostMapping
    public ResponseEntity<?> createQuotation(@Valid @RequestBody QuotationRequest request) {
        try {
            QuotationResponse response = quotationService.createQuotation(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Bad Request");
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestParam QuotationStatus status) {
        try {
            return ResponseEntity.ok(quotationService.updateStatus(id, status));
        } catch (IllegalArgumentException e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Not Found");
            err.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
        } catch (IllegalStateException e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Conflict");
            err.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(err);
        }
    }

    @PostMapping("/{id}/convert")
    public ResponseEntity<?> convertToSubscription(@PathVariable Long id) {
        try {
            SubscriptionResponse sub = quotationService.convertToSubscription(id);
            return ResponseEntity.status(HttpStatus.CREATED).body(sub);
        } catch (IllegalArgumentException e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Not Found");
            err.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
        } catch (IllegalStateException e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Conflict");
            err.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(err);
        }
    }
}
