package com.brightloop.payments;

import com.brightloop.payments.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @GetMapping("/invoice/{invoiceId}")
    public ResponseEntity<List<PaymentResponse>> getByInvoiceId(@PathVariable Long invoiceId) {
        return ResponseEntity.ok(paymentService.getPaymentsByInvoiceId(invoiceId));
    }

    @PostMapping("/manual")
    public ResponseEntity<PaymentResponse> recordManual(@Valid @RequestBody ManualPaymentRequest request) {
        return new ResponseEntity<>(paymentService.recordManualPayment(request), HttpStatus.CREATED);
    }

    @PostMapping("/gateway/checkout")
    public ResponseEntity<CheckoutSessionResponse> initiateCheckout(@Valid @RequestBody CheckoutSessionRequest request) {
        return ResponseEntity.ok(paymentService.initiateCheckoutSession(request));
    }

    @PostMapping("/gateway/confirm")
    public ResponseEntity<PaymentResponse> confirmPayment(@Valid @RequestBody ConfirmPaymentRequest request) {
        return ResponseEntity.ok(paymentService.confirmPayment(request));
    }
}
