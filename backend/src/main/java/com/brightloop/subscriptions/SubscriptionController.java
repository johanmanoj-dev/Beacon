package com.brightloop.subscriptions;

import com.brightloop.subscriptions.dto.SubscriptionResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    @GetMapping
    public ResponseEntity<List<SubscriptionResponse>> getAllSubscriptions(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Long planId) {
        return ResponseEntity.ok(subscriptionService.getAllSubscriptions(status, customerId, planId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getSubscriptionById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(subscriptionService.getSubscriptionById(id));
        } catch (IllegalArgumentException e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Not Found");
            err.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
        }
    }

    @PostMapping("/{id}/pause")
    public ResponseEntity<?> pauseSubscription(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(subscriptionService.pauseSubscription(id));
        } catch (IllegalArgumentException e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Not Found");
            err.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
        } catch (IllegalStateException e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Bad Request");
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PostMapping("/{id}/resume")
    public ResponseEntity<?> resumeSubscription(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(subscriptionService.resumeSubscription(id));
        } catch (IllegalArgumentException e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Not Found");
            err.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
        } catch (IllegalStateException e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Bad Request");
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PostMapping("/{id}/close")
    public ResponseEntity<?> closeSubscription(
            @PathVariable Long id,
            @RequestParam(required = false) String reason) {
        try {
            return ResponseEntity.ok(subscriptionService.closeSubscription(id, reason));
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

    @PostMapping("/{id}/renew")
    public ResponseEntity<?> renewSubscription(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(subscriptionService.renewSubscription(id));
        } catch (IllegalArgumentException e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Not Found");
            err.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
        }
    }

    @PostMapping("/auto-close-check")
    public ResponseEntity<Map<String, Object>> runAutoCloseCheck() {
        return ResponseEntity.ok(subscriptionService.autoCloseExpiredSubscriptions());
    }
}
