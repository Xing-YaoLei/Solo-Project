package com.renewal.controller;

import com.renewal.dto.EnrollmentDetailDTO;
import com.renewal.dto.FunnelDashboardDTO;
import com.renewal.service.FunnelService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/funnel")
@RequiredArgsConstructor
public class FunnelController {

    private final FunnelService funnelService;

    @GetMapping("/dashboard")
    public ResponseEntity<FunnelDashboardDTO> getDashboard() {
        return ResponseEntity.ok(funnelService.getDashboard());
    }

    @GetMapping("/details")
    public ResponseEntity<List<EnrollmentDetailDTO>> getDetails(
            @RequestParam(required = false) String stage) {
        return ResponseEntity.ok(funnelService.getEnrollmentDetails(stage));
    }
}
