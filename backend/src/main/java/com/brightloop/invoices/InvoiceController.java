package com.brightloop.invoices;

import com.brightloop.invoices.dto.InvoiceResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/invoices")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class InvoiceController {

    private final InvoiceService invoiceService;

    @GetMapping
    public ResponseEntity<List<InvoiceResponse>> getAllInvoices(
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Long subscriptionId,
            @RequestParam(required = false) InvoiceStatus status
    ) {
        if (customerId != null) {
            return ResponseEntity.ok(invoiceService.getInvoicesByCustomerId(customerId));
        }
        if (subscriptionId != null) {
            return ResponseEntity.ok(invoiceService.getInvoicesBySubscriptionId(subscriptionId));
        }
        if (status != null) {
            return ResponseEntity.ok(invoiceService.getInvoicesByStatus(status));
        }
        return ResponseEntity.ok(invoiceService.getAllInvoices());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getInvoiceById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(invoiceService.getInvoiceById(id));
        } catch (IllegalArgumentException e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Not Found");
            err.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
        }
    }

    @GetMapping("/number/{invoiceNumber}")
    public ResponseEntity<?> getInvoiceByNumber(@PathVariable String invoiceNumber) {
        try {
            return ResponseEntity.ok(invoiceService.getInvoiceByNumber(invoiceNumber));
        } catch (IllegalArgumentException e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Not Found");
            err.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
        }
    }

    @PostMapping("/{id}/confirm")
    public ResponseEntity<?> confirmInvoice(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(invoiceService.confirmInvoice(id));
        } catch (IllegalArgumentException e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Not Found");
            err.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
        } catch (IllegalStateException e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Bad Request");
            err.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(err);
        }
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancelInvoice(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(invoiceService.cancelInvoice(id));
        } catch (IllegalArgumentException e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Not Found");
            err.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
        } catch (IllegalStateException e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Bad Request");
            err.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(err);
        }
    }
}
