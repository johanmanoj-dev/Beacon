package com.brightloop.common;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class HealthController {

    @Autowired(required = false)
    private JdbcTemplate jdbcTemplate;

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> checkHealth() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "Brightloop Subscription Engine");
        response.put("timestamp", Instant.now().toString());

        try {
            if (jdbcTemplate != null) {
                Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM users", Integer.class);
                response.put("database", "CONNECTED (MySQL brightloop_db)");
                response.put("users_count", count != null ? count : 0);
            } else {
                response.put("database", "UNKNOWN");
            }
        } catch (Exception e) {
            response.put("database", "ERROR: " + e.getMessage());
        }

        return ResponseEntity.ok(response);
    }
}
