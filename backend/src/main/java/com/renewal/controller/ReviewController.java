package com.renewal.controller;

import com.renewal.dto.ReviewGenerateRequest;
import com.renewal.dto.ReviewMaterialDTO;
import com.renewal.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/review")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping("/generate")
    public ResponseEntity<ReviewMaterialDTO> generateReview(@RequestBody ReviewGenerateRequest request) {
        return ResponseEntity.ok(reviewService.generateReview(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReviewMaterialDTO> getReview(@PathVariable Long id) {
        return ResponseEntity.ok(reviewService.getReview(id));
    }

    @GetMapping
    public ResponseEntity<List<ReviewMaterialDTO>> listReviews(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(reviewService.listReviews(status));
    }

    @PostMapping("/{id}/publish")
    public ResponseEntity<ReviewMaterialDTO> publishReview(@PathVariable Long id) {
        return ResponseEntity.ok(reviewService.publishReview(id));
    }
}
