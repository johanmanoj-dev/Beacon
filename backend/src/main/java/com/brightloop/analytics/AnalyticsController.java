package com.brightloop.analytics;

import com.brightloop.analytics.dto.KpiResponse;
import com.brightloop.analytics.dto.RevenueTrendDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/kpi")
    public ResponseEntity<KpiResponse> getKpis() {
        return ResponseEntity.ok(analyticsService.getKpis());
    }

    @GetMapping("/revenue-trend")
    public ResponseEntity<List<RevenueTrendDto>> getRevenueTrend() {
        return ResponseEntity.ok(analyticsService.getRevenueTrend());
    }
}
