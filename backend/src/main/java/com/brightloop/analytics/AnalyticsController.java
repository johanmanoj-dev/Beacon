package com.brightloop.analytics;

import com.brightloop.analytics.dto.KpiResponse;
import com.brightloop.analytics.dto.ReceivableAgingDto;
import com.brightloop.analytics.dto.RevenueTrendDto;
import com.brightloop.analytics.dto.StatusDistributionDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final DataSeeder dataSeeder;

    @GetMapping("/kpi")
    public ResponseEntity<KpiResponse> getKpis() {
        return ResponseEntity.ok(analyticsService.getKpis());
    }

    @GetMapping("/revenue-trend")
    public ResponseEntity<List<RevenueTrendDto>> getRevenueTrend() {
        return ResponseEntity.ok(analyticsService.getRevenueTrend());
    }

    @GetMapping("/status-distribution")
    public ResponseEntity<List<StatusDistributionDto>> getStatusDistribution() {
        return ResponseEntity.ok(analyticsService.getStatusDistribution());
    }

    @GetMapping("/receivables-aging")
    public ResponseEntity<List<ReceivableAgingDto>> getReceivablesAging() {
        return ResponseEntity.ok(analyticsService.getReceivablesAging());
    }

    @PostMapping("/seed-demo-data")
    public ResponseEntity<Map<String, Object>> seedDemoData() {
        return ResponseEntity.ok(dataSeeder.seedAll());
    }
}
