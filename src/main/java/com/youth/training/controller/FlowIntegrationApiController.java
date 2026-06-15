package com.youth.training.controller;

import com.youth.training.common.Result;
import com.youth.training.service.FlowIntegrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/flow")
@RequiredArgsConstructor
public class FlowIntegrationApiController {

    private final FlowIntegrationService flowIntegrationService;

    @GetMapping("/student/{studentId}/course/{courseId}/detail")
    public Result<Map<String, Object>> studentFullProgressDetail(
            @PathVariable Long studentId,
            @PathVariable Long courseId) {
        return Result.success(flowIntegrationService.getStudentFullProgressDetail(studentId, courseId));
    }

    @GetMapping("/student/{studentId}/weak-analysis")
    public Result<Map<String, Object>> studentWeakPointAnalysis(@PathVariable Long studentId) {
        return Result.success(flowIntegrationService.getStudentWeakPointAnalysis(studentId));
    }
}
