package com.brightloop.discounts;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DiscountRepository extends JpaRepository<Discount, Long> {
    Optional<Discount> findByCodeIgnoreCase(String code);
    boolean existsByCodeIgnoreCase(String code);
}
