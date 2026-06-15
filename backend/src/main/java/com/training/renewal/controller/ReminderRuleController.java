package com.training.renewal.controller;

import com.training.renewal.common.Result;
import com.training.renewal.entity.ReminderRule;
import com.training.renewal.service.ReminderRuleService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/reminder-rules")
@RequiredArgsConstructor
public class ReminderRuleController {

    private final ReminderRuleService ruleService;

    @GetMapping("/active")
    public Result<List<ReminderRule>> getActiveRules() {
        return Result.success(ruleService.getActiveRules());
    }

    @GetMapping("/recent-changes")
    public Result<List<ReminderRule>> getRecentChanges(
            @RequestParam(defaultValue = "10") int limit) {
        return Result.success(ruleService.getRecentChanges(limit));
    }

    @GetMapping("/type/{ruleType}")
    public Result<List<ReminderRule>> getRulesByType(@PathVariable String ruleType) {
        return Result.success(ruleService.getRulesByType(ruleType));
    }

    @GetMapping("/type-stats")
    public Result<List<Map<String, Object>>> getRuleTypeStats() {
        return Result.success(ruleService.getRuleTypeStats());
    }

    @GetMapping("/{id}")
    public Result<ReminderRule> getRuleById(@PathVariable Long id) {
        ReminderRule rule = ruleService.getRuleById(id);
        if (rule == null) {
            return Result.error("规则不存在");
        }
        return Result.success(rule);
    }

    @PostMapping
    public Result<ReminderRule> createRule(
            @RequestBody ReminderRule rule,
            @RequestParam(required = false) String operatorId,
            @RequestParam(required = false) String operatorName,
            @RequestParam(required = false) String changeReason) {
        return Result.success(ruleService.createRule(
                rule, operatorId, operatorName, changeReason));
    }

    @PutMapping("/{id}")
    public Result<ReminderRule> updateRule(
            @PathVariable Long id,
            @RequestBody ReminderRule rule,
            @RequestParam(required = false) String operatorId,
            @RequestParam(required = false) String operatorName,
            @RequestParam(required = false) String changeReason) {
        return Result.success(ruleService.updateRule(
                id, rule, operatorId, operatorName, changeReason));
    }

    @GetMapping("/version-distribution")
    public Result<List<Map<String, Object>>> getVersionDistribution() {
        return Result.success(ruleService.getVersionDistribution());
    }
}
