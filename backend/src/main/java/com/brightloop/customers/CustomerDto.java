package com.brightloop.customers;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerDto {
    private Long id;
    private Long userId;
    private String userFullName;
    private String userEmail;
    private String companyName;
    private String contactEmail;
    private String phone;
    private String address;
    private LocalDateTime createdAt;

    public static CustomerDto fromEntity(Customer c) {
        return CustomerDto.builder()
                .id(c.getId())
                .userId(c.getUser() != null ? c.getUser().getId() : null)
                .userFullName(c.getUser() != null ? c.getUser().getFullName() : null)
                .userEmail(c.getUser() != null ? c.getUser().getEmail() : null)
                .companyName(c.getCompanyName())
                .contactEmail(c.getContactEmail())
                .phone(c.getPhone())
                .address(c.getAddress())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
