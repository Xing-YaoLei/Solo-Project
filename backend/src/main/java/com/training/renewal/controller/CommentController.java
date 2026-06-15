package com.training.renewal.controller;

import com.training.renewal.common.Result;
import com.training.renewal.entity.ProgressComment;
import com.training.renewal.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @PostMapping
    public Result<ProgressComment> createComment(@RequestBody ProgressComment comment) {
        return Result.success(commentService.createComment(comment));
    }

    @PutMapping("/{id}")
    public Result<ProgressComment> updateComment(
            @PathVariable Long id,
            @RequestBody ProgressComment comment) {
        return Result.success(commentService.updateComment(id, comment));
    }

    @GetMapping("/student/{studentNo}")
    public Result<List<ProgressComment>> getCommentsByStudent(
            @PathVariable String studentNo) {
        return Result.success(commentService.getCommentsByStudent(studentNo));
    }

    @GetMapping("/consultant/{consultantId}")
    public Result<List<ProgressComment>> getCommentsByConsultant(
            @PathVariable String consultantId) {
        return Result.success(commentService.getCommentsByConsultant(consultantId));
    }

    @GetMapping("/risk-distribution")
    public Result<List<Map<String, Object>>> getRiskLevelDistribution() {
        return Result.success(commentService.getRiskLevelDistribution());
    }

    @GetMapping("/pending-followups")
    public Result<List<ProgressComment>> getPendingFollowUps() {
        return Result.success(commentService.getPendingFollowUps());
    }

    @GetMapping("/consultant-stats")
    public Result<List<Map<String, Object>>> getCommentStatsByConsultant() {
        return Result.success(commentService.getCommentStatsByConsultant());
    }
}
