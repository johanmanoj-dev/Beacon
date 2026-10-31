package com.brightloop.customers;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByContactEmail(String email);
    Optional<Customer> findByUserId(Long userId);
    boolean existsByContactEmail(String email);
}
