package com.renewal.controller;

import com.renewal.dto.ChapterProgressDTO;
import com.renewal.service.ChapterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/chapter")
@RequiredArgsConstructor
public class ChapterController {

    private final ChapterService chapterService;

    @GetMapping
    public ResponseEntity<List<ChapterProgressDTO>> getAllChapterProgress() {
        return ResponseEntity.ok(chapterService.getAllChapterProgress());
    }

    @GetMapping("/{courseId}")
    public ResponseEntity<ChapterProgressDTO> getChapterProgress(@PathVariable Long courseId) {
        return ResponseEntity.ok(chapterService.getChapterProgress(courseId));
    }
}
