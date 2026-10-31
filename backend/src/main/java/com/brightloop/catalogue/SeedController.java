package com.brightloop.catalogue;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/seed")
@RequiredArgsConstructor
public class SeedController {

    private final DataSeeder dataSeeder;

    @PostMapping
    public ResponseEntity<Map<String, Object>> seedDatabase(@RequestParam(defaultValue = "false") boolean force) {
        return ResponseEntity.ok(dataSeeder.seedData(force));
    }
}
