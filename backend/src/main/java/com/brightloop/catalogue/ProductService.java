package com.brightloop.catalogue;

import com.brightloop.catalogue.dto.ProductRequest;
import com.brightloop.catalogue.dto.ProductResponse;
import com.brightloop.catalogue.dto.ProductVariantDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;

    @Transactional(readOnly = true)
    public List<ProductResponse> getAllProducts() {
        return productRepository.findAll().stream()
                .map(ProductResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProductResponse getProductById(Long id) {
        Product p = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + id));
        return ProductResponse.fromEntity(p);
    }

    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        if (request.getSalesPrice() != null && request.getSalesPrice().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Sales price cannot be negative");
        }
        if (request.getCostPrice() != null && request.getCostPrice().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Cost price cannot be negative");
        }

        Product product = Product.builder()
                .name(request.getName().trim())
                .productType(request.getProductType())
                .salesPrice(request.getSalesPrice())
                .costPrice(request.getCostPrice())
                .notes(request.getNotes())
                .variants(new ArrayList<>())
                .build();

        if (request.getVariants() != null && !request.getVariants().isEmpty()) {
            for (ProductVariantDto vDto : request.getVariants()) {
                ProductVariant variant = ProductVariant.builder()
                        .product(product)
                        .variantName(vDto.getVariantName().trim())
                        .priceAdjustment(vDto.getPriceAdjustment() != null ? vDto.getPriceAdjustment() : BigDecimal.ZERO)
                        .build();
                product.getVariants().add(variant);
            }
        }

        Product saved = productRepository.save(product);
        return ProductResponse.fromEntity(saved);
    }

    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        if (request.getSalesPrice() != null && request.getSalesPrice().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Sales price cannot be negative");
        }
        if (request.getCostPrice() != null && request.getCostPrice().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Cost price cannot be negative");
        }

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + id));

        product.setName(request.getName().trim());
        product.setProductType(request.getProductType());
        product.setSalesPrice(request.getSalesPrice());
        product.setCostPrice(request.getCostPrice());
        product.setNotes(request.getNotes());

        // Update variants in-place, add new, remove dropped
        if (request.getVariants() != null) {
            java.util.Map<Long, ProductVariantDto> incomingById = request.getVariants().stream()
                    .filter(v -> v.getId() != null)
                    .collect(Collectors.toMap(ProductVariantDto::getId, v -> v, (a, b) -> a));

            List<Long> incomingIds = new ArrayList<>(incomingById.keySet());

            // Remove dropped variants
            product.getVariants().removeIf(v -> v.getId() != null && !incomingIds.contains(v.getId()));

            // Update existing variants
            for (ProductVariant existing : product.getVariants()) {
                if (existing.getId() != null && incomingById.containsKey(existing.getId())) {
                    ProductVariantDto vDto = incomingById.get(existing.getId());
                    existing.setVariantName(vDto.getVariantName().trim());
                    existing.setPriceAdjustment(vDto.getPriceAdjustment() != null ? vDto.getPriceAdjustment() : BigDecimal.ZERO);
                }
            }

            // Add new variants
            List<Long> existingIds = product.getVariants().stream()
                    .map(ProductVariant::getId)
                    .filter(java.util.Objects::nonNull)
                    .toList();

            for (ProductVariantDto vDto : request.getVariants()) {
                if (vDto.getId() == null || !existingIds.contains(vDto.getId())) {
                    ProductVariant variant = ProductVariant.builder()
                            .product(product)
                            .variantName(vDto.getVariantName().trim())
                            .priceAdjustment(vDto.getPriceAdjustment() != null ? vDto.getPriceAdjustment() : BigDecimal.ZERO)
                            .build();
                    product.getVariants().add(variant);
                }
            }
        }

        Product saved = productRepository.save(product);
        return ProductResponse.fromEntity(saved);
    }

    @Transactional
    public void deleteProduct(Long id) {
        if (!productRepository.existsById(id)) {
            throw new IllegalArgumentException("Product not found with id: " + id);
        }
        productRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public BigDecimal calculateEffectivePrice(Long productId, Long variantId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + productId));

        BigDecimal price = product.getSalesPrice();
        if (variantId != null) {
            ProductVariant variant = productVariantRepository.findById(variantId)
                    .orElseThrow(() -> new IllegalArgumentException("Variant not found with id: " + variantId));
            price = price.add(variant.getPriceAdjustment());
        }
        return price;
    }
    @Transactional
    public ProductVariantDto addVariant(Long productId, ProductVariantDto dto) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + productId));

        ProductVariant variant = ProductVariant.builder()
                .product(product)
                .variantName(dto.getVariantName().trim())
                .priceAdjustment(dto.getPriceAdjustment() != null ? dto.getPriceAdjustment() : BigDecimal.ZERO)
                .build();

        ProductVariant saved = productVariantRepository.save(variant);
        return ProductVariantDto.fromEntity(saved);
    }

    @Transactional
    public ProductVariantDto updateVariant(Long productId, Long variantId, ProductVariantDto dto) {
        ProductVariant variant = productVariantRepository.findById(variantId)
                .orElseThrow(() -> new IllegalArgumentException("Variant not found with id: " + variantId));

        if (!variant.getProduct().getId().equals(productId)) {
            throw new IllegalArgumentException("Variant does not belong to product " + productId);
        }

        variant.setVariantName(dto.getVariantName().trim());
        variant.setPriceAdjustment(dto.getPriceAdjustment() != null ? dto.getPriceAdjustment() : BigDecimal.ZERO);
        ProductVariant saved = productVariantRepository.save(variant);
        return ProductVariantDto.fromEntity(saved);
    }

    @Transactional
    public void deleteVariant(Long productId, Long variantId) {
        ProductVariant variant = productVariantRepository.findById(variantId)
                .orElseThrow(() -> new IllegalArgumentException("Variant not found with id: " + variantId));

        if (!variant.getProduct().getId().equals(productId)) {
            throw new IllegalArgumentException("Variant does not belong to product " + productId);
        }

        productVariantRepository.delete(variant);
    }
}