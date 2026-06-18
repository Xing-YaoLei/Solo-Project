package com.testdrive.controller;

import com.testdrive.dto.FeedbackUpdateDTO;
import com.testdrive.entity.FeedbackChangeLog;
import com.testdrive.entity.TestDriveFeedback;
import com.testdrive.service.FeedbackService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/feedbacks")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackService feedbackService;

    @GetMapping("/{id}")
    public ResponseEntity<TestDriveFeedback> get(@PathVariable Long id) {
        return ResponseEntity.ok(feedbackService.getFeedback(id));
    }

    @PostMapping
    public TestDriveFeedback create(@RequestBody TestDriveFeedback feedback) {
        return feedbackService.createFeedback(feedback);
    }

    @PutMapping
    public ResponseEntity<TestDriveFeedback> update(@Valid @RequestBody FeedbackUpdateDTO dto) {
        return ResponseEntity.ok(feedbackService.updateFeedback(dto));
    }

    @GetMapping("/{id}/change-logs")
    public List<FeedbackChangeLog> getChangeLogs(@PathVariable Long id) {
        return feedbackService.getChangeLogs(id);
    }
}
