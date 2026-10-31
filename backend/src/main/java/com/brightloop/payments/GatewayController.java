package com.brightloop.payments;

import com.brightloop.payments.dto.GatewayCheckoutRequest;
import com.brightloop.payments.dto.GatewayCheckoutResponse;
import com.brightloop.payments.dto.GatewayConfirmRequest;
import com.brightloop.payments.dto.GatewayConfirmResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/gateway")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class GatewayController {

    private final PaymentService paymentService;

    @PostMapping("/checkout")
    public ResponseEntity<?> initiateCheckout(@Valid @RequestBody GatewayCheckoutRequest request) {
        try {
            GatewayCheckoutResponse resp = paymentService.initiateGatewayCheckout(request);
            return ResponseEntity.ok(resp);
        } catch (IllegalArgumentException e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Bad Request");
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        } catch (IllegalStateException e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Conflict");
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PostMapping("/confirm")
    public ResponseEntity<?> confirmPayment(@Valid @RequestBody GatewayConfirmRequest request) {
        try {
            GatewayConfirmResponse resp = paymentService.confirmGatewayPayment(request);
            return ResponseEntity.ok(resp);
        } catch (IllegalArgumentException e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Not Found");
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }
}
