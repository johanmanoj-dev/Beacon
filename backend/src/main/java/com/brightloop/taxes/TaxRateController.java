package com.brightloop.taxes;

import com.brightloop.taxes.dto.TaxRateDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/taxes")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class TaxRateController {

    private final TaxRateService taxRateService;

    @GetMapping
    public ResponseEntity<List<TaxRateDto>> getAll(@RequestParam(required = false, defaultValue = "false") boolean activeOnly) {
        if (activeOnly) {
            return ResponseEntity.ok(taxRateService.getActiveTaxRates());
        }
        return ResponseEntity.ok(taxRateService.getAllTaxRates());
    }

    @PostMapping
    public ResponseEntity<TaxRateDto> create(@Valid @RequestBody TaxRateDto dto) {
        return new ResponseEntity<>(taxRateService.createTaxRate(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TaxRateDto> update(@PathVariable Long id, @RequestBody TaxRateDto dto) {
        return ResponseEntity.ok(taxRateService.updateTaxRate(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        taxRateService.deleteTaxRate(id);
        return ResponseEntity.noContent().build();
    }
}
