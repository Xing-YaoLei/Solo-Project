package com.renewal.controller;

import com.renewal.dto.ScoreChartDTO;
import com.renewal.service.ScoreFeedbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/score")
@RequiredArgsConstructor
public class ScoreFeedbackController {

    private final ScoreFeedbackService scoreFeedbackService;

    @GetMapping("/{enrollmentId}")
    public ResponseEntity<ScoreChartDTO> getScoreChart(@PathVariable Long enrollmentId) {
        return ResponseEntity.ok(scoreFeedbackService.getScoreChart(enrollmentId));
    }
}
