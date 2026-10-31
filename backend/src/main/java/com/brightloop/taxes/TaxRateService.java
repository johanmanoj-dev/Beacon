package com.brightloop.taxes;

import com.brightloop.taxes.dto.TaxRateRequest;
import com.brightloop.taxes.dto.TaxRateResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaxRateService {

    private final TaxRateRepository taxRateRepository;

    @Transactional(readOnly = true)
    public List<TaxRateResponse> getAllTaxRates() {
        return taxRateRepository.findAll().stream()
                .map(TaxRateResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TaxRateResponse> getActiveTaxRates() {
        return taxRateRepository.findByIsActiveTrue().stream()
                .map(TaxRateResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TaxRateResponse getTaxRateById(Long id) {
        TaxRate taxRate = taxRateRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tax rate not found with id: " + id));
        return TaxRateResponse.fromEntity(taxRate);
    }

    @Transactional
    public TaxRateResponse createTaxRate(TaxRateRequest request) {
        TaxRate taxRate = TaxRate.builder()
                .name(request.getName().trim())
                .ratePercent(request.getRatePercent())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();
        return TaxRateResponse.fromEntity(taxRateRepository.save(taxRate));
    }

    @Transactional
    public TaxRateResponse updateTaxRate(Long id, TaxRateRequest request) {
        TaxRate taxRate = taxRateRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tax rate not found with id: " + id));

        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            taxRate.setName(request.getName().trim());
        }
        if (request.getRatePercent() != null) {
            taxRate.setRatePercent(request.getRatePercent());
        }
        if (request.getIsActive() != null) {
            taxRate.setIsActive(request.getIsActive());
        }

        return TaxRateResponse.fromEntity(taxRateRepository.save(taxRate));
    }

    @Transactional
    public void deleteTaxRate(Long id) {
        if (!taxRateRepository.existsById(id)) {
            throw new IllegalArgumentException("Tax rate not found with id: " + id);
        }
        taxRateRepository.deleteById(id);
    }
}
