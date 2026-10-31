package com.brightloop.customers;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;

    @Transactional(readOnly = true)
    public List<CustomerDto> getAllCustomers() {
        return customerRepository.findAll().stream()
                .map(CustomerDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CustomerDto getCustomerById(Long id) {
        Customer c = customerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found with id: " + id));
        return CustomerDto.fromEntity(c);
    }

    @Transactional
    public CustomerDto createCustomer(CustomerDto dto) {
        if (customerRepository.existsByContactEmail(dto.getContactEmail().trim().toLowerCase())) {
            throw new IllegalArgumentException("Customer with this email already exists");
        }

        Customer customer = Customer.builder()
                .companyName(dto.getCompanyName().trim())
                .contactEmail(dto.getContactEmail().trim().toLowerCase())
                .phone(dto.getPhone())
                .address(dto.getAddress())
                .build();

        customer = customerRepository.save(customer);
        return CustomerDto.fromEntity(customer);
    }

    @Transactional
    public CustomerDto updateCustomer(Long id, CustomerDto dto) {
        Customer c = customerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found with id: " + id));

        c.setCompanyName(dto.getCompanyName().trim());
        c.setPhone(dto.getPhone());
        c.setAddress(dto.getAddress());

        c = customerRepository.save(c);
        return CustomerDto.fromEntity(c);
    }
}
