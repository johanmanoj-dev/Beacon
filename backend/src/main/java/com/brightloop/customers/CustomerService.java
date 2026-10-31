package com.brightloop.customers;

import com.brightloop.users.User;
import com.brightloop.users.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;

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

        User user = null;
        if (dto.getUserId() != null) {
            user = userRepository.findById(dto.getUserId())
                    .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + dto.getUserId()));
        }

        Customer customer = Customer.builder()
                .companyName(dto.getCompanyName().trim())
                .contactEmail(dto.getContactEmail().trim().toLowerCase())
                .phone(dto.getPhone())
                .address(dto.getAddress())
                .user(user)
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

        if (dto.getUserId() != null) {
            User user = userRepository.findById(dto.getUserId())
                    .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + dto.getUserId()));
            c.setUser(user);
        }

        c = customerRepository.save(c);
        return CustomerDto.fromEntity(c);
    }

    @Transactional
    public CustomerDto linkUser(Long customerId, Long userId) {
        Customer c = customerRepository.findById(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found with id: " + customerId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

        c.setUser(user);
        Customer saved = customerRepository.save(c);
        return CustomerDto.fromEntity(saved);
    }

    @Transactional
    public CustomerDto unlinkUser(Long customerId) {
        Customer c = customerRepository.findById(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found with id: " + customerId));

        c.setUser(null);
        Customer saved = customerRepository.save(c);
        return CustomerDto.fromEntity(saved);
    }
}
