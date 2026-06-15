package com.renewal.controller;

import com.renewal.dto.ThresholdConfigDTO;
import com.renewal.service.ThresholdConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/threshold")
@RequiredArgsConstructor
public class ThresholdConfigController {

    private final ThresholdConfigService thresholdConfigService;

    @GetMapping
    public ResponseEntity<List<ThresholdConfigDTO>> getAllConfigs() {
        return ResponseEntity.ok(thresholdConfigService.getAllConfigs());
    }

    @GetMapping(params = "group")
    public ResponseEntity<List<ThresholdConfigDTO>> getConfigsByGroup(@RequestParam String group) {
        return ResponseEntity.ok(thresholdConfigService.getConfigsByGroup(group));
    }

    @PutMapping
    public ResponseEntity<ThresholdConfigDTO> updateConfig(@RequestBody ThresholdConfigDTO dto) {
        return ResponseEntity.ok(thresholdConfigService.updateConfig(dto));
    }
}
