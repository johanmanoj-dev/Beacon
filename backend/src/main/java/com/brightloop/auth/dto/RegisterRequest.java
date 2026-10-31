package com.brightloop.auth.dto;

import com.brightloop.users.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterRequest {

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Valid email is required")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 9, message = "Password must be more than 8 characters")
    private String password;

    private Role role; // Defaults to CUSTOMER if null

    // Optional customer company info if registering as customer
    private String companyName;
    private String phone;
    private String address;
}
