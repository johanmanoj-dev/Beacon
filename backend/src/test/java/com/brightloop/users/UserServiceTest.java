package com.brightloop.users;

import com.brightloop.auth.dto.RegisterRequest;
import com.brightloop.users.dto.UserResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private User mockStaff;

    @BeforeEach
    void setUp() {
        mockStaff = User.builder()
                .id(1L)
                .email("staff@brightloop.com")
                .fullName("Staff One")
                .passwordHash("hashed")
                .role(Role.STAFF)
                .isActive(true)
                .build();
    }

    @Test
    void testCreateStaffWithValidPassword() {
        RegisterRequest req = RegisterRequest.builder()
                .email("newstaff@brightloop.com")
                .fullName("New Staff")
                .password("Password123!")
                .build();

        when(userRepository.existsByEmail("newstaff@brightloop.com")).thenReturn(false);
        when(passwordEncoder.encode("Password123!")).thenReturn("encodedHash");
        when(userRepository.save(any(User.class))).thenAnswer(i -> {
            User u = i.getArgument(0);
            u.setId(2L);
            return u;
        });

        UserResponse resp = userService.createStaff(req);
        assertNotNull(resp);
        assertEquals(Role.STAFF, resp.getRole());
        assertEquals("newstaff@brightloop.com", resp.getEmail());
    }

    @Test
    void testCreateStaffFailsOnWeakPassword() {
        RegisterRequest req = RegisterRequest.builder()
                .email("weak@brightloop.com")
                .fullName("Weak Staff")
                .password("weak")
                .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            userService.createStaff(req);
        });

        assertTrue(ex.getMessage().contains("Password must be more than 8 characters"));
    }

    @Test
    void testToggleActiveStatus() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(mockStaff));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        UserResponse resp = userService.toggleActiveStatus(1L);
        assertFalse(resp.getIsActive());

        UserResponse resp2 = userService.toggleActiveStatus(1L);
        assertTrue(resp2.getIsActive());
    }
}
