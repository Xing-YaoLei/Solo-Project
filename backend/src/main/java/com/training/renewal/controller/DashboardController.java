package com.training.renewal.controller;

import com.training.renewal.common.Result;
import com.training.renewal.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/overview")
    public Result<Map<String, Object>> getOverview() {
        return Result.success(dashboardService.getOverviewStats());
    }

    @GetMapping("/tag-distribution")
    public Result<List<Map<String, Object>>> getTagDistribution() {
        return Result.success(dashboardService.getCourseTagDistribution());
    }

    @GetMapping("/progress-funnel")
    public Result<List<Map<String, Object>>> getProgressFunnel() {
        return Result.success(dashboardService.getProgressFunnel());
    }

    @GetMapping("/score-ranking")
    public Result<List<Map<String, Object>>> getScoreRanking(
            @RequestParam(defaultValue = "20") int limit) {
        return Result.success(dashboardService.getScoreRanking(limit));
    }

    @GetMapping("/bottom-progress")
    public Result<List<Map<String, Object>>> getBottomProgress(
            @RequestParam(defaultValue = "20") int limit) {
        return Result.success(dashboardService.getBottomProgressStudents(limit));
    }

    @GetMapping("/expiring-students")
    public Result<?> getExpiringStudents(
            @RequestParam(defaultValue = "30") int days) {
        return Result.success(dashboardService.getExpiringStudents(days));
    }

    @GetMapping("/consultant-stats")
    public Result<List<Map<String, Object>>> getAllConsultantStats() {
        return Result.success(dashboardService.getAllConsultantStats());
    }

    @GetMapping("/consultant/{consultantId}")
    public Result<Map<String, Object>> getConsultantStats(
            @PathVariable String consultantId) {
        return Result.success(dashboardService.getConsultantStats(consultantId));
    }

    @PostMapping("/cache/refresh")
    public Result<Void> refreshCache() {
        dashboardService.evictDashboardCache();
        return Result.success("缓存已刷新", null);
    }
}
