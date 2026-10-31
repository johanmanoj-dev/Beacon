package com.brightloop.discounts;

import com.brightloop.discounts.dto.DiscountRequest;
import com.brightloop.discounts.dto.DiscountResponse;
import com.brightloop.discounts.dto.DiscountValidationRequest;
import com.brightloop.discounts.dto.DiscountValidationResult;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/discounts")
@RequiredArgsConstructor
public class DiscountController {

    private final DiscountService discountService;

    @GetMapping
    public ResponseEntity<List<DiscountResponse>> getAllDiscounts() {
        return ResponseEntity.ok(discountService.getAllDiscounts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getDiscountById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(discountService.getDiscountById(id));
        } catch (IllegalArgumentException e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Not Found");
            err.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
        }
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<?> getDiscountByCode(@PathVariable String code) {
        try {
            return ResponseEntity.ok(discountService.getDiscountByCode(code));
        } catch (IllegalArgumentException e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Not Found");
            err.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
        }
    }

    @PostMapping
    public ResponseEntity<?> createDiscount(@Valid @RequestBody DiscountRequest request) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(discountService.createDiscount(request));
        } catch (IllegalArgumentException e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Bad Request");
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Internal Error");
            err.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateDiscount(@PathVariable Long id, @Valid @RequestBody DiscountRequest request) {
        try {
            return ResponseEntity.ok(discountService.updateDiscount(id, request));
        } catch (IllegalArgumentException e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Not Found or Invalid Data");
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Internal Error");
            err.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDiscount(@PathVariable Long id) {
        try {
            discountService.deleteDiscount(id);
            Map<String, String> res = new HashMap<>();
            res.put("message", "Discount deleted successfully");
            return ResponseEntity.ok(res);
        } catch (IllegalArgumentException e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Not Found");
            err.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
        }
    }

    @PostMapping("/validate")
    public ResponseEntity<DiscountValidationResult> validateDiscount(@RequestBody DiscountValidationRequest request) {
        return ResponseEntity.ok(discountService.validateAndCalculate(request));
    }
}
