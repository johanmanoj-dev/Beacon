package com.brightloop.payments;

import com.brightloop.payments.dto.ManualPaymentRequest;
import com.brightloop.payments.dto.PaymentResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class PaymentController {

    private final PaymentService paymentService;

    @GetMapping
    public ResponseEntity<List<PaymentResponse>> getAllPayments(
            @RequestParam(required = false) Long invoiceId
    ) {
        if (invoiceId != null) {
            return ResponseEntity.ok(paymentService.getPaymentsByInvoiceId(invoiceId));
        }
        return ResponseEntity.ok(paymentService.getAllPayments());
    }

    @PostMapping("/manual")
    public ResponseEntity<?> recordManualPayment(@Valid @RequestBody ManualPaymentRequest request) {
        try {
            PaymentResponse resp = paymentService.recordManualPayment(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(resp);
        } catch (IllegalArgumentException e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Bad Request");
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        } catch (IllegalStateException e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Conflict");
            err.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(err);
        }
    }
}
