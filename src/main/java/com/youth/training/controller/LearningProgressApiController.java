package com.youth.training.controller;

import com.youth.training.common.Result;
import com.youth.training.entity.LearningProgress;
import com.youth.training.repository.LearningProgressRepository;
import com.youth.training.service.LearningProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/progress")
@RequiredArgsConstructor
public class LearningProgressApiController {

    private final LearningProgressService learningProgressService;
    private final LearningProgressRepository learningProgressRepository;

    @GetMapping("/list")
    public Result<List<LearningProgress>> list(@RequestParam(required = false) Long studentId) {
        List<LearningProgress> list;
        if (studentId != null) {
            list = learningProgressService.getStudentProgressList(studentId);
        } else {
            list = learningProgressRepository.findAll();
        }
        return Result.success(list);
    }

    @GetMapping("/{id}")
    public Result<LearningProgress> detail(@PathVariable Long id) {
        return Result.success(learningProgressRepository.findById(id).orElse(null));
    }

    @PostMapping("/calculate")
    public Result<LearningProgress> calculate(@RequestBody Map<String, Long> params) {
        Long studentId = params.get("studentId");
        Long courseId = params.get("courseId");
        return Result.success(learningProgressService.calculateCourseProgress(studentId, courseId));
    }

    @PutMapping("/{id}/status")
    public Result<LearningProgress> updateStatus(@PathVariable Long id,
                                                  @RequestParam String status,
                                                  @RequestParam(required = false) String reason,
                                                  @RequestParam(required = false) String operator) {
        return Result.success(learningProgressService.updateProgressStatus(id, status, reason, operator));
    }

    @GetMapping("/warnings")
    public Result<List<LearningProgress>> warnings(@RequestParam(defaultValue = "60") Double threshold) {
        return Result.success(learningProgressService.getWarningProgressList(threshold));
    }
}
