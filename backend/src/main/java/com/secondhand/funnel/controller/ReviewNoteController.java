package com.secondhand.funnel.controller;

import com.secondhand.funnel.common.Result;
import com.secondhand.funnel.entity.ReviewNote;
import com.secondhand.funnel.service.ReviewNoteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/review-notes")
@RequiredArgsConstructor
public class ReviewNoteController {

    private final ReviewNoteService reviewNoteService;

    @PostMapping
    public Result<ReviewNote> create(@Valid @RequestBody ReviewNote note) {
        return Result.success(reviewNoteService.create(note));
    }

    @GetMapping("/{id}")
    public Result<ReviewNote> getById(@PathVariable Long id) {
        return Result.success(reviewNoteService.getById(id));
    }

    @GetMapping
    public Result<List<ReviewNote>> listAll() {
        return Result.success(reviewNoteService.listAll());
    }

    @GetMapping("/car/{carId}")
    public Result<List<ReviewNote>> getByCarId(@PathVariable Long carId) {
        return Result.success(reviewNoteService.getByCarId(carId));
    }

    @GetMapping("/car/{carId}/stage/{stage}")
    public Result<List<ReviewNote>> getByCarIdAndStage(@PathVariable Long carId, @PathVariable String stage) {
        return Result.success(reviewNoteService.getByCarIdAndStage(carId, stage));
    }

    @GetMapping("/created-by/{userId}")
    public Result<List<ReviewNote>> getByCreatedBy(@PathVariable Long userId) {
        return Result.success(reviewNoteService.getByCreatedBy(userId));
    }

    @PutMapping("/{id}")
    public Result<ReviewNote> update(@PathVariable Long id, @Valid @RequestBody ReviewNote note) {
        return Result.success(reviewNoteService.update(id, note));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        reviewNoteService.delete(id);
        return Result.success();
    }
}
