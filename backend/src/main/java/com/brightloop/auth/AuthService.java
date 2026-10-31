package com.brightloop.auth;

import com.brightloop.auth.dto.*;
import com.brightloop.customers.Customer;
import com.brightloop.customers.CustomerRepository;
import com.brightloop.users.Role;
import com.brightloop.users.User;
import com.brightloop.users.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Base64;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;

    // Pattern: >8 chars, at least 1 uppercase, at least 1 lowercase, at least 1 special char
    private static final Pattern UPPERCASE_PATTERN = Pattern.compile("[A-Z]");
    private static final Pattern LOWERCASE_PATTERN = Pattern.compile("[a-z]");
    private static final Pattern SPECIAL_PATTERN = Pattern.compile("[^a-zA-Z0-9]");

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        validatePassword(request.getPassword());

        if (userRepository.existsByEmail(request.getEmail().trim().toLowerCase())) {
            throw new IllegalArgumentException("An account with this email already exists");
        }

        Role assignedRole = request.getRole() != null ? request.getRole() : Role.CUSTOMER;

        User user = User.builder()
                .email(request.getEmail().trim().toLowerCase())
                .fullName(request.getFullName().trim())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(assignedRole)
                .isActive(true)
                .build();

        user = userRepository.save(user);

        Long customerId = null;
        String companyName = request.getCompanyName();

        if (assignedRole == Role.CUSTOMER) {
            String cName = (companyName != null && !companyName.isBlank()) ? companyName.trim() : user.getFullName();
            Customer customer = Customer.builder()
                    .user(user)
                    .companyName(cName)
                    .contactEmail(user.getEmail())
                    .phone(request.getPhone())
                    .address(request.getAddress())
                    .build();
            customer = customerRepository.save(customer);
            customerId = customer.getId();
            companyName = customer.getCompanyName();
        }

        String token = generateToken(user);
        UserDto userDto = UserDto.fromEntity(user, customerId, companyName);

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .user(userDto)
                .message("Registration successful")
                .build();
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new IllegalStateException("Your account has been deactivated. Please contact an administrator.");
        }

        Long customerId = null;
        String companyName = null;
        if (user.getRole() == Role.CUSTOMER) {
            var customerOpt = customerRepository.findByUserId(user.getId());
            if (customerOpt.isPresent()) {
                customerId = customerOpt.get().getId();
                companyName = customerOpt.get().getCompanyName();
            }
        }

        String token = generateToken(user);
        UserDto userDto = UserDto.fromEntity(user, customerId, companyName);

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .user(userDto)
                .message("Login successful")
                .build();
    }

    @Transactional
    public UserDto createStaff(RegisterRequest request) {
        validatePassword(request.getPassword());

        if (userRepository.existsByEmail(request.getEmail().trim().toLowerCase())) {
            throw new IllegalArgumentException("An account with this email already exists");
        }

        User staff = User.builder()
                .email(request.getEmail().trim().toLowerCase())
                .fullName(request.getFullName().trim())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(Role.STAFF)
                .isActive(true)
                .build();

        staff = userRepository.save(staff);
        return UserDto.fromEntity(staff, null, null);
    }

    private void validatePassword(String password) {
        if (password == null || password.length() <= 8) {
            throw new IllegalArgumentException("Password must be more than 8 characters");
        }
        if (!UPPERCASE_PATTERN.matcher(password).find()) {
            throw new IllegalArgumentException("Password must contain at least one uppercase letter");
        }
        if (!LOWERCASE_PATTERN.matcher(password).find()) {
            throw new IllegalArgumentException("Password must contain at least one lowercase letter");
        }
        if (!SPECIAL_PATTERN.matcher(password).find()) {
            throw new IllegalArgumentException("Password must contain at least one special character");
        }
    }

    private String generateToken(User user) {
        String payload = user.getId() + ":" + user.getEmail() + ":" + user.getRole() + ":" + UUID.randomUUID();
        return Base64.getUrlEncoder().encodeToString(payload.getBytes());
    }
}
