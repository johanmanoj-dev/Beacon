package com.brightloop.taxes;

import com.brightloop.taxes.dto.TaxRateDto;
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
        TaxRate taxRate = TaxRate.builder()
                .name(dto.getName().trim())
                .ratePercent(dto.getRatePercent())
                .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                .build();
        return TaxRateDto.fromEntity(taxRateRepository.save(taxRate));
    }

    @Transactional
    public TaxRateDto updateTaxRate(Long id, TaxRateDto dto) {
        TaxRate taxRate = taxRateRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tax rate not found with id: " + id));

        if (dto.getName() != null) taxRate.setName(dto.getName().trim());
        if (dto.getRatePercent() != null) taxRate.setRatePercent(dto.getRatePercent());
        if (dto.getIsActive() != null) taxRate.setIsActive(dto.getIsActive());

        return TaxRateDto.fromEntity(taxRateRepository.save(taxRate));
    }

    @Transactional
    public void deleteTaxRate(Long id) {
        taxRateRepository.deleteById(id);
    }
}
