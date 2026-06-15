package com.youth.training.controller;

import com.youth.training.common.Result;
import com.youth.training.entity.ScoreFeedback;
import com.youth.training.service.ScoreFeedbackService;
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

@RestController
@RequestMapping("/api/scores")
@RequiredArgsConstructor
public class ScoreFeedbackApiController {

    private final ScoreFeedbackService scoreFeedbackService;

    @GetMapping("/student/{studentId}")
    public Result<List<ScoreFeedback>> listByStudent(@PathVariable Long studentId) {
        return Result.success(scoreFeedbackService.listFeedbackByStudent(studentId));
    }

    @GetMapping("/homework/{homeworkId}")
    public Result<List<ScoreFeedback>> listByHomework(@PathVariable Long homeworkId) {
        return Result.success(scoreFeedbackService.listFeedbackByHomework(homeworkId));
    }

    @GetMapping("/{id}")
    public Result<ScoreFeedback> detail(@PathVariable Long id) {
        return Result.success(scoreFeedbackService.getFeedback(id));
    }

    @PostMapping("/")
    public Result<ScoreFeedback> create(@RequestBody ScoreFeedback feedback) {
        return Result.success(scoreFeedbackService.createFeedback(feedback));
    }

    @PutMapping("/{id}/review")
    public Result<ScoreFeedback> review(@PathVariable Long id,
                                         @RequestParam Double score,
                                         @RequestParam(required = false) String teacherComment,
                                         @RequestParam(required = false) String gradeLevel,
                                         @RequestParam(required = false) String weakPoints,
                                         @RequestParam String reviewedBy) {
        return Result.success(scoreFeedbackService.reviewFeedback(id, score, teacherComment, gradeLevel, weakPoints, reviewedBy));
    }

    @PutMapping("/{id}/status")
    public Result<ScoreFeedback> updateStatus(@PathVariable Long id,
                                               @RequestParam String status,
                                               @RequestParam(required = false) String reason,
                                               @RequestParam(required = false) String operator) {
        return Result.success(scoreFeedbackService.updateFeedbackStatus(id, status, reason, operator));
    }

    @GetMapping("/student/{studentId}/weak-points")
    public Result<List<String>> getWeakPoints(@PathVariable Long studentId) {
        return Result.success(scoreFeedbackService.getWeakPointTagsByStudent(studentId));
    }
}
