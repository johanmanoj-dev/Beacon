package com.brightloop.discounts;

import com.brightloop.catalogue.Product;
import com.brightloop.catalogue.ProductRepository;
import com.brightloop.discounts.dto.DiscountRequest;
import com.brightloop.discounts.dto.DiscountResponse;
import com.brightloop.discounts.dto.DiscountValidationRequest;
import com.brightloop.discounts.dto.DiscountValidationResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DiscountService {

    private final DiscountRepository discountRepository;
    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public List<DiscountResponse> getAllDiscounts() {
        return discountRepository.findAll().stream()
                .map(DiscountResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DiscountResponse getDiscountById(Long id) {
        Discount discount = discountRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Discount not found with id: " + id));
        return DiscountResponse.fromEntity(discount);
    }

    @Transactional(readOnly = true)
    public DiscountResponse getDiscountByCode(String code) {
        Discount discount = discountRepository.findByCodeIgnoreCase(code.trim())
                .orElseThrow(() -> new IllegalArgumentException("Invalid discount code: " + code));
        return DiscountResponse.fromEntity(discount);
    }

    @Transactional
    public DiscountResponse createDiscount(DiscountRequest request) {
        String code = request.getCode().trim().toUpperCase();
        if (discountRepository.existsByCodeIgnoreCase(code)) {
            throw new IllegalArgumentException("Discount code already exists: " + code);
        }

        Product product = null;
        if (request.getProductId() != null) {
            product = productRepository.findById(request.getProductId())
                    .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + request.getProductId()));
        }

        Discount discount = Discount.builder()
                .code(code)
                .discountType(request.getDiscountType())
                .value(request.getValue())
                .minPurchaseAmount(request.getMinPurchaseAmount() != null ? request.getMinPurchaseAmount() : BigDecimal.ZERO)
                .minQuantity(request.getMinQuantity() != null ? request.getMinQuantity() : 1)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .usageLimit(request.getUsageLimit() != null ? request.getUsageLimit() : 100)
                .timesUsed(0)
                .appliesTo(request.getAppliesTo())
                .product(product)
                .build();

        return DiscountResponse.fromEntity(discountRepository.save(discount));
    }

    @Transactional
    public DiscountResponse updateDiscount(Long id, DiscountRequest request) {
        Discount discount = discountRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Discount not found with id: " + id));

        if (request.getCode() != null && !request.getCode().trim().isEmpty()) {
            String newCode = request.getCode().trim().toUpperCase();
            if (!newCode.equalsIgnoreCase(discount.getCode()) && discountRepository.existsByCodeIgnoreCase(newCode)) {
                throw new IllegalArgumentException("Discount code already exists: " + newCode);
            }
            discount.setCode(newCode);
        }

        if (request.getDiscountType() != null) {
            discount.setDiscountType(request.getDiscountType());
        }
        if (request.getValue() != null) {
            discount.setValue(request.getValue());
        }
        if (request.getMinPurchaseAmount() != null) {
            discount.setMinPurchaseAmount(request.getMinPurchaseAmount());
        }
        if (request.getMinQuantity() != null) {
            discount.setMinQuantity(request.getMinQuantity());
        }
        if (request.getStartDate() != null) {
            discount.setStartDate(request.getStartDate());
        }
        if (request.getEndDate() != null) {
            discount.setEndDate(request.getEndDate());
        }
        if (request.getUsageLimit() != null) {
            discount.setUsageLimit(request.getUsageLimit());
        }
        if (request.getAppliesTo() != null) {
            discount.setAppliesTo(request.getAppliesTo());
        }
        if (request.getProductId() != null) {
            Product product = productRepository.findById(request.getProductId())
                    .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + request.getProductId()));
            discount.setProduct(product);
        }

        return DiscountResponse.fromEntity(discountRepository.save(discount));
    }

    @Transactional
    public void deleteDiscount(Long id) {
        if (!discountRepository.existsById(id)) {
            throw new IllegalArgumentException("Discount not found with id: " + id);
        }
        discountRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public DiscountValidationResult validateAndCalculate(DiscountValidationRequest request) {
        if (request.getCode() == null || request.getCode().trim().isEmpty()) {
            return DiscountValidationResult.builder()
                    .valid(false)
                    .message("Discount code cannot be empty")
                    .discountAmount(BigDecimal.ZERO)
                    .finalAmount(request.getAmount() != null ? request.getAmount() : BigDecimal.ZERO)
                    .build();
        }

        String code = request.getCode().trim().toUpperCase();
        Discount discount = discountRepository.findByCodeIgnoreCase(code).orElse(null);
        if (discount == null) {
            return DiscountValidationResult.builder()
                    .valid(false)
                    .message("Discount code not found: " + code)
                    .discountAmount(BigDecimal.ZERO)
                    .finalAmount(request.getAmount() != null ? request.getAmount() : BigDecimal.ZERO)
                    .build();
        }

        LocalDate today = LocalDate.now();
        if (discount.getStartDate() != null && today.isBefore(discount.getStartDate())) {
            return DiscountValidationResult.builder()
                    .valid(false)
                    .message("Discount code is not active yet (starts " + discount.getStartDate() + ")")
                    .discountAmount(BigDecimal.ZERO)
                    .finalAmount(request.getAmount() != null ? request.getAmount() : BigDecimal.ZERO)
                    .build();
        }

        if (discount.getEndDate() != null && today.isAfter(discount.getEndDate())) {
            return DiscountValidationResult.builder()
                    .valid(false)
                    .message("Discount code has expired on " + discount.getEndDate())
                    .discountAmount(BigDecimal.ZERO)
                    .finalAmount(request.getAmount() != null ? request.getAmount() : BigDecimal.ZERO)
                    .build();
        }

        if (discount.getUsageLimit() != null && discount.getTimesUsed() >= discount.getUsageLimit()) {
            return DiscountValidationResult.builder()
                    .valid(false)
                    .message("Discount code usage limit (" + discount.getUsageLimit() + ") has been reached")
                    .discountAmount(BigDecimal.ZERO)
                    .finalAmount(request.getAmount() != null ? request.getAmount() : BigDecimal.ZERO)
                    .build();
        }

        BigDecimal baseAmount = request.getAmount() != null ? request.getAmount() : BigDecimal.ZERO;
        int qty = request.getQuantity() != null ? request.getQuantity() : 1;

        if (discount.getMinQuantity() != null && qty < discount.getMinQuantity()) {
            return DiscountValidationResult.builder()
                    .valid(false)
                    .message("Minimum quantity required for discount is " + discount.getMinQuantity() + " (current: " + qty + ")")
                    .discountAmount(BigDecimal.ZERO)
                    .finalAmount(baseAmount)
                    .build();
        }

        if (discount.getMinPurchaseAmount() != null && baseAmount.compareTo(discount.getMinPurchaseAmount()) < 0) {
            return DiscountValidationResult.builder()
                    .valid(false)
                    .message("Minimum purchase amount required is $" + discount.getMinPurchaseAmount() + " (current: $" + baseAmount + ")")
                    .discountAmount(BigDecimal.ZERO)
                    .finalAmount(baseAmount)
                    .build();
        }

        if (discount.getAppliesTo() == DiscountScope.PRODUCT && discount.getProduct() != null) {
            if (request.getProductId() == null || !discount.getProduct().getId().equals(request.getProductId())) {
                return DiscountValidationResult.builder()
                        .valid(false)
                        .message("Discount applies only to product: " + discount.getProduct().getName())
                        .discountAmount(BigDecimal.ZERO)
                        .finalAmount(baseAmount)
                        .build();
            }
        }

        BigDecimal discountAmount;
        if (discount.getDiscountType() == DiscountType.PERCENTAGE) {
            discountAmount = baseAmount.multiply(discount.getValue())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        } else {
            discountAmount = discount.getValue().min(baseAmount);
        }

        BigDecimal finalAmount = baseAmount.subtract(discountAmount).max(BigDecimal.ZERO);

        return DiscountValidationResult.builder()
                .valid(true)
                .message("Discount " + discount.getCode() + " applied successfully")
                .code(discount.getCode())
                .discountAmount(discountAmount)
                .finalAmount(finalAmount)
                .build();
    }
}
