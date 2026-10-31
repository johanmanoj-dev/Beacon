package com.brightloop.auth.dto;

import com.brightloop.users.Role;
import com.brightloop.users.User;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDto {
    private Long id;
    private String email;
    private String fullName;
    private Role role;
    private Boolean isActive;
    private Long customerId;
    private String companyName;

    public static UserDto fromEntity(User user, Long customerId, String companyName) {
        return UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .isActive(user.getIsActive())
                .customerId(customerId)
                .companyName(companyName)
                .build();
    }
}
