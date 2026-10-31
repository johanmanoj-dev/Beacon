package com.brightloop.discounts;

import com.brightloop.discounts.dto.DiscountDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/discounts")
@RequiredArgsConstructor
public class DiscountController {

    private final DiscountService discountService;

    @GetMapping
    public ResponseEntity<List<DiscountDto>> getAll() {
        return ResponseEntity.ok(discountService.getAllDiscounts());
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<DiscountDto> getByCode(@PathVariable String code) {
        return discountService.getByCode(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<DiscountDto> create(@Valid @RequestBody DiscountDto dto) {
        return new ResponseEntity<>(discountService.createDiscount(dto), HttpStatus.CREATED);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        discountService.deleteDiscount(id);
        return ResponseEntity.noContent().build();
    }
}
