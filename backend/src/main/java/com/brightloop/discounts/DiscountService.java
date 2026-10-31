package com.brightloop.discounts;

import com.brightloop.catalogue.Product;
import com.brightloop.catalogue.ProductRepository;
import com.brightloop.discounts.dto.DiscountDto;
import com.brightloop.discounts.dto.DiscountValidationRequest;
import com.brightloop.discounts.dto.DiscountValidationResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
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
        if (code == null || code.trim().isEmpty()) {
            return Optional.empty();
        }
        return discountRepository.findByCode(code.trim().toUpperCase())
                .or(() -> discountRepository.findByCodeIgnoreCase(code.trim()))
                .map(DiscountDto::fromEntity);
    }

    @Transactional
    public DiscountDto createDiscount(DiscountDto dto) {
        if (dto.getCode() == null || dto.getCode().trim().isEmpty()) {
            throw new IllegalArgumentException("Discount code is required");
        }
        String normalizedCode = dto.getCode().trim().toUpperCase();
        if (discountRepository.findByCode(normalizedCode).isPresent() ||
            discountRepository.findByCodeIgnoreCase(normalizedCode).isPresent()) {
            throw new IllegalArgumentException("Discount code already exists: " + dto.getCode());
        }

        if (dto.getDiscountType() == null) {
            throw new IllegalArgumentException("Discount type is required");
        }
        if (dto.getValue() == null) {
            throw new IllegalArgumentException("Discount value is required");
        }
        if (dto.getValue().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Discount value must be greater than zero");
        }
        if (dto.getDiscountType() == DiscountType.PERCENTAGE && dto.getValue().compareTo(new BigDecimal("100.00")) > 0) {
            throw new IllegalArgumentException("Percentage discount value cannot exceed 100%");
        }

        BigDecimal scaledValue = dto.getValue().setScale(2, RoundingMode.HALF_UP);

        BigDecimal minPurchase = BigDecimal.ZERO;
        if (dto.getMinPurchaseAmount() != null) {
            if (dto.getMinPurchaseAmount().compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("Minimum purchase amount cannot be negative");
            }
            minPurchase = dto.getMinPurchaseAmount().setScale(2, RoundingMode.HALF_UP);
        }

        int minQty = 1;
        if (dto.getMinQuantity() != null) {
            if (dto.getMinQuantity() < 0) {
                throw new IllegalArgumentException("Minimum quantity cannot be negative");
            }
            minQty = dto.getMinQuantity();
        }

        if (dto.getStartDate() != null && dto.getEndDate() != null && dto.getStartDate().isAfter(dto.getEndDate())) {
            throw new IllegalArgumentException("Discount start date cannot be after end date");
        }

        int usageLimit = 100;
        if (dto.getUsageLimit() != null) {
            if (dto.getUsageLimit() < 1) {
                throw new IllegalArgumentException("Usage limit must be at least 1");
            }
            usageLimit = dto.getUsageLimit();
        }

        Product product = null;
        if (dto.getProductId() != null) {
            product = productRepository.findById(dto.getProductId())
                    .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + dto.getProductId()));
        }

        Discount discount = Discount.builder()
                .code(normalizedCode)
                .discountType(dto.getDiscountType())
                .value(scaledValue)
                .minPurchaseAmount(minPurchase)
                .minQuantity(minQty)
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .usageLimit(usageLimit)
                .timesUsed(0)
                .appliesTo(dto.getAppliesTo() != null ? dto.getAppliesTo() : DiscountScope.SUBSCRIPTION)
                .product(product)
                .build();

        return DiscountDto.fromEntity(discountRepository.save(discount));
    }

    @Transactional
    public DiscountDto updateDiscount(Long id, DiscountDto dto) {
        Discount discount = discountRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Discount not found with id: " + id));

        if (dto.getCode() != null) {
            if (dto.getCode().trim().isEmpty()) {
                throw new IllegalArgumentException("Discount code cannot be empty");
            }
            String normalizedCode = dto.getCode().trim().toUpperCase();
            if (!normalizedCode.equalsIgnoreCase(discount.getCode()) &&
                discountRepository.findByCode(normalizedCode).isPresent()) {
                throw new IllegalArgumentException("Discount code already exists: " + dto.getCode());
            }
            discount.setCode(normalizedCode);
        }

        if (dto.getDiscountType() != null) {
            discount.setDiscountType(dto.getDiscountType());
        }

        if (dto.getValue() != null) {
            if (dto.getValue().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Discount value must be greater than zero");
            }
            DiscountType effectiveType = dto.getDiscountType() != null ? dto.getDiscountType() : discount.getDiscountType();
            if (effectiveType == DiscountType.PERCENTAGE && dto.getValue().compareTo(new BigDecimal("100.00")) > 0) {
                throw new IllegalArgumentException("Percentage discount value cannot exceed 100%");
            }
            discount.setValue(dto.getValue().setScale(2, RoundingMode.HALF_UP));
        }

        if (dto.getMinPurchaseAmount() != null) {
            if (dto.getMinPurchaseAmount().compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("Minimum purchase amount cannot be negative");
            }
            discount.setMinPurchaseAmount(dto.getMinPurchaseAmount().setScale(2, RoundingMode.HALF_UP));
        }

        if (dto.getMinQuantity() != null) {
            if (dto.getMinQuantity() < 0) {
                throw new IllegalArgumentException("Minimum quantity cannot be negative");
            }
            discount.setMinQuantity(dto.getMinQuantity());
        }

        LocalDate start = dto.getStartDate() != null ? dto.getStartDate() : discount.getStartDate();
        LocalDate end = dto.getEndDate() != null ? dto.getEndDate() : discount.getEndDate();
        if (start != null && end != null && start.isAfter(end)) {
            throw new IllegalArgumentException("Discount start date cannot be after end date");
        }
        if (dto.getStartDate() != null) discount.setStartDate(dto.getStartDate());
        if (dto.getEndDate() != null) discount.setEndDate(dto.getEndDate());

        if (dto.getUsageLimit() != null) {
            if (dto.getUsageLimit() < 1) {
                throw new IllegalArgumentException("Usage limit must be at least 1");
            }
            discount.setUsageLimit(dto.getUsageLimit());
        }

        if (dto.getAppliesTo() != null) {
            discount.setAppliesTo(dto.getAppliesTo());
        }

        if (dto.getProductId() != null) {
            Product product = productRepository.findById(dto.getProductId())
                    .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + dto.getProductId()));
            discount.setProduct(product);
        }

        return DiscountDto.fromEntity(discountRepository.save(discount));
    }

    @Transactional(readOnly = true)
    public DiscountValidationResult validateDiscount(DiscountValidationRequest req) {
        BigDecimal amount = (req.getAmount() != null) ? req.getAmount().setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        int quantity = (req.getQuantity() != null) ? req.getQuantity() : 1;

        if (req.getCode() == null || req.getCode().trim().isEmpty()) {
            return DiscountValidationResult.builder()
                    .valid(false)
                    .message("Promo code is required")
                    .code("")
                    .discountAmount(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP))
                    .finalAmount(amount)
                    .build();
        }

        String searchCode = req.getCode().trim().toUpperCase();
        Optional<Discount> discountOpt = discountRepository.findByCode(searchCode)
                .or(() -> discountRepository.findByCodeIgnoreCase(searchCode));

        if (discountOpt.isEmpty()) {
            return DiscountValidationResult.builder()
                    .valid(false)
                    .message("Promo code '" + searchCode + "' not found or inactive")
                    .code(searchCode)
                    .discountAmount(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP))
                    .finalAmount(amount)
                    .build();
        }

        Discount discount = discountOpt.get();
        LocalDate today = LocalDate.now();

        if (discount.getStartDate() != null && today.isBefore(discount.getStartDate())) {
            return DiscountValidationResult.builder()
                    .valid(false)
                    .message("Discount code '" + searchCode + "' is not active yet (starts " + discount.getStartDate() + ")")
                    .code(searchCode)
                    .discountAmount(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP))
                    .finalAmount(amount)
                    .build();
        }

        if (discount.getEndDate() != null && today.isAfter(discount.getEndDate())) {
            return DiscountValidationResult.builder()
                    .valid(false)
                    .message("Discount code '" + searchCode + "' has expired on " + discount.getEndDate())
                    .code(searchCode)
                    .discountAmount(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP))
                    .finalAmount(amount)
                    .build();
        }

        if (discount.getUsageLimit() != null && discount.getTimesUsed() != null && discount.getTimesUsed() >= discount.getUsageLimit()) {
            return DiscountValidationResult.builder()
                    .valid(false)
                    .message("Discount code '" + searchCode + "' has reached its maximum redemption limit")
                    .code(searchCode)
                    .discountAmount(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP))
                    .finalAmount(amount)
                    .build();
        }

        if (discount.getMinQuantity() != null && quantity < discount.getMinQuantity()) {
            return DiscountValidationResult.builder()
                    .valid(false)
                    .message(String.format("Minimum quantity of %d required to qualify for discount '%s'", discount.getMinQuantity(), searchCode))
                    .code(searchCode)
                    .discountAmount(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP))
                    .finalAmount(amount)
                    .build();
        }

        if (discount.getMinPurchaseAmount() != null && amount.compareTo(discount.getMinPurchaseAmount()) < 0) {
            return DiscountValidationResult.builder()
                    .valid(false)
                    .message(String.format("Minimum purchase amount of $%s required for discount '%s'", discount.getMinPurchaseAmount(), searchCode))
                    .code(searchCode)
                    .discountAmount(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP))
                    .finalAmount(amount)
                    .build();
        }

        BigDecimal discountAmount;
        if (discount.getDiscountType() == DiscountType.PERCENTAGE) {
            discountAmount = amount.multiply(discount.getValue()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        } else {
            discountAmount = discount.getValue().min(amount).setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal finalAmount = amount.subtract(discountAmount).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);

        return DiscountValidationResult.builder()
                .valid(true)
                .message("Discount '" + searchCode + "' applied successfully!")
                .code(searchCode)
                .discountAmount(discountAmount)
                .finalAmount(finalAmount)
                .build();
    }

    @Transactional
    public void deleteDiscount(Long id) {
        if (!discountRepository.existsById(id)) {
            throw new IllegalArgumentException("Discount not found with id: " + id);
        }
        discountRepository.deleteById(id);
    }
}
