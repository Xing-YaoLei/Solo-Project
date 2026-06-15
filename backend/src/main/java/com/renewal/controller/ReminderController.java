package com.renewal.controller;

import com.renewal.dto.RemarkRequest;
import com.renewal.dto.ReminderRuleDTO;
import com.renewal.dto.ReminderRuleDTO.TriggerLogItem;
import com.renewal.service.ReminderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/reminder")
@RequiredArgsConstructor
public class ReminderController {

    private final ReminderService reminderService;

    @GetMapping("/rules")
    public ResponseEntity<List<ReminderRuleDTO>> getActiveRules() {
        return ResponseEntity.ok(reminderService.getActiveRules());
    }

    @GetMapping("/rules/{ruleId}")
    public ResponseEntity<ReminderRuleDTO> getRuleDetail(@PathVariable Long ruleId) {
        return ResponseEntity.ok(reminderService.getRuleDetail(ruleId));
    }

    @PutMapping("/rules")
    public ResponseEntity<ReminderRuleDTO> updateRule(@RequestBody ReminderRuleDTO ruleDTO) {
        return ResponseEntity.ok(reminderService.updateRule(ruleDTO));
    }

    @PostMapping("/remark")
    public ResponseEntity<Void> addRemark(@RequestBody RemarkRequest request) {
        reminderService.addRemark(request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/anomalies")
    public ResponseEntity<List<TriggerLogItem>> getAnomalies(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        return ResponseEntity.ok(reminderService.getAnomalyLogs(startDate, endDate));
    }
}
