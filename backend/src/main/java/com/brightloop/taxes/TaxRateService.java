package com.brightloop.taxes;

import com.brightloop.taxes.dto.TaxRateDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaxRateService {

    private final TaxRateRepository taxRateRepository;

    @Transactional(readOnly = true)
    public List<TaxRateDto> getAllTaxRates() {
        return taxRateRepository.findAll().stream()
                .map(TaxRateDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TaxRateDto> getActiveTaxRates() {
        return taxRateRepository.findByIsActiveTrue().stream()
                .map(TaxRateDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public TaxRateDto createTaxRate(TaxRateDto dto) {
        if (dto.getName() == null || dto.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Tax rate name is required");
        }
        if (dto.getRatePercent() == null) {
            throw new IllegalArgumentException("Rate percent is required");
        }
        if (dto.getRatePercent().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Rate percent cannot be negative");
        }
        if (dto.getRatePercent().compareTo(new BigDecimal("100.00")) > 0) {
            throw new IllegalArgumentException("Rate percent cannot exceed 100.00%");
        }

        BigDecimal scaledRate = dto.getRatePercent().setScale(2, RoundingMode.HALF_UP);

        TaxRate taxRate = TaxRate.builder()
                .name(dto.getName().trim())
                .ratePercent(scaledRate)
                .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                .build();
        return TaxRateDto.fromEntity(taxRateRepository.save(taxRate));
    }

    @Transactional
    public TaxRateDto updateTaxRate(Long id, TaxRateDto dto) {
        TaxRate taxRate = taxRateRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tax rate not found with id: " + id));

        if (dto.getName() != null) {
            if (dto.getName().trim().isEmpty()) {
                throw new IllegalArgumentException("Tax rate name cannot be empty");
            }
            taxRate.setName(dto.getName().trim());
        }
        if (dto.getRatePercent() != null) {
            if (dto.getRatePercent().compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("Rate percent cannot be negative");
            }
            if (dto.getRatePercent().compareTo(new BigDecimal("100.00")) > 0) {
                throw new IllegalArgumentException("Rate percent cannot exceed 100.00%");
            }
            taxRate.setRatePercent(dto.getRatePercent().setScale(2, RoundingMode.HALF_UP));
        }
        if (dto.getIsActive() != null) {
            taxRate.setIsActive(dto.getIsActive());
        }

        return TaxRateDto.fromEntity(taxRateRepository.save(taxRate));
    }

    @Transactional
    public void deleteTaxRate(Long id) {
        if (!taxRateRepository.existsById(id)) {
            throw new IllegalArgumentException("Tax rate not found with id: " + id);
        }
        taxRateRepository.deleteById(id);
    }
}
