package com.brightloop.taxes;

import com.brightloop.taxes.dto.TaxRateRequest;
import com.brightloop.taxes.dto.TaxRateResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/taxes")
@RequiredArgsConstructor
public class TaxRateController {

    private final TaxRateService taxRateService;

    @GetMapping
    public ResponseEntity<List<TaxRateResponse>> getAllTaxRates() {
        return ResponseEntity.ok(taxRateService.getAllTaxRates());
    }

    @GetMapping("/active")
    public ResponseEntity<List<TaxRateResponse>> getActiveTaxRates() {
        return ResponseEntity.ok(taxRateService.getActiveTaxRates());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTaxRateById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(taxRateService.getTaxRateById(id));
        } catch (IllegalArgumentException e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Not Found");
            err.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
        }
    }

    @PostMapping
    public ResponseEntity<?> createTaxRate(@Valid @RequestBody TaxRateRequest request) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(taxRateService.createTaxRate(request));
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Bad Request");
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTaxRate(@PathVariable Long id, @Valid @RequestBody TaxRateRequest request) {
        try {
            return ResponseEntity.ok(taxRateService.updateTaxRate(id, request));
        } catch (IllegalArgumentException e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Not Found");
            err.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Bad Request");
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTaxRate(@PathVariable Long id) {
        try {
            taxRateService.deleteTaxRate(id);
            Map<String, String> res = new HashMap<>();
            res.put("message", "Tax rate deleted successfully");
            return ResponseEntity.ok(res);
        } catch (IllegalArgumentException e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Not Found");
            err.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
        }
    }
}
