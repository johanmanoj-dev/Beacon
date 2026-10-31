package com.brightloop.discounts;

import com.brightloop.catalogue.Product;
import com.brightloop.catalogue.ProductRepository;
import com.brightloop.discounts.dto.DiscountDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DiscountService {

    private final DiscountRepository discountRepository;
    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public List<DiscountDto> getAllDiscounts() {
        return discountRepository.findAll().stream()
                .map(DiscountDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<DiscountDto> getByCode(String code) {
        return discountRepository.findByCode(code.trim().toUpperCase())
                .map(DiscountDto::fromEntity);
    }

    @Transactional
    public DiscountDto createDiscount(DiscountDto dto) {
        if (discountRepository.findByCode(dto.getCode().trim().toUpperCase()).isPresent()) {
            throw new IllegalArgumentException("Discount code already exists: " + dto.getCode());
        }

        Product product = null;
        if (dto.getProductId() != null) {
            product = productRepository.findById(dto.getProductId())
                    .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + dto.getProductId()));
        }

        Discount discount = Discount.builder()
                .code(dto.getCode().trim().toUpperCase())
                .discountType(dto.getDiscountType())
                .value(dto.getValue())
                .minPurchaseAmount(dto.getMinPurchaseAmount() != null ? dto.getMinPurchaseAmount() : BigDecimal.ZERO)
                .minQuantity(dto.getMinQuantity() != null ? dto.getMinQuantity() : 1)
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .usageLimit(dto.getUsageLimit() != null ? dto.getUsageLimit() : 100)
                .timesUsed(0)
                .appliesTo(dto.getAppliesTo() != null ? dto.getAppliesTo() : DiscountScope.SUBSCRIPTION)
                .product(product)
                .build();

        return DiscountDto.fromEntity(discountRepository.save(discount));
    }

    @Transactional
    public void deleteDiscount(Long id) {
        discountRepository.deleteById(id);
    }
}
