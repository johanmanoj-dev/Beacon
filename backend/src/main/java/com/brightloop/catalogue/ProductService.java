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
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + id));

        product.setName(request.getName().trim());
        product.setProductType(request.getProductType());
        product.setSalesPrice(request.getSalesPrice());
        product.setCostPrice(request.getCostPrice());
        product.setNotes(request.getNotes());

        // Update variants
        product.getVariants().clear();
        if (request.getVariants() != null) {
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
}
