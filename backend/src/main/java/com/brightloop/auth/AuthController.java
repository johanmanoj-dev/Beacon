package com.brightloop.auth;

import com.brightloop.auth.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            AuthResponse response = authService.register(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Bad Request");
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Internal Server Error");
            err.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Unauthorized");
            err.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(err);
        } catch (IllegalStateException e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Forbidden");
            err.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(err);
        }
    }

    @PostMapping("/staff")
    public ResponseEntity<?> createStaff(@Valid @RequestBody RegisterRequest request) {
        try {
            UserDto staff = authService.createStaff(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(staff);
        } catch (IllegalArgumentException e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Bad Request");
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }
}
