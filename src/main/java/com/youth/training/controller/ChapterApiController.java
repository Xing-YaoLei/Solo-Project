package com.youth.training.controller;

import com.youth.training.common.Result;
import com.youth.training.entity.Chapter;
import com.youth.training.entity.Homework;
import com.youth.training.service.ChapterService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/chapters")
@RequiredArgsConstructor
public class ChapterApiController {

    private final ChapterService chapterService;

    @GetMapping("/course/{courseId}")
    public Result<List<Chapter>> listByCourse(@PathVariable Long courseId) {
        return Result.success(chapterService.listChaptersByCourse(courseId));
    }

    @GetMapping("/{id}")
    public Result<Chapter> detail(@PathVariable Long id) {
        return Result.success(chapterService.getChapter(id));
    }

    @PostMapping("/")
    public Result<Chapter> create(@RequestBody Chapter chapter) {
        return Result.success(chapterService.createChapter(chapter));
    }

    @PutMapping("/{id}")
    public Result<Chapter> update(@PathVariable Long id, @RequestBody Chapter chapter) {
        return Result.success(chapterService.updateChapter(id, chapter));
    }

    @DeleteMapping("/{id}")
    public Result<Chapter> delete(@PathVariable Long id) {
        return Result.success(chapterService.deleteChapter(id));
    }

    @GetMapping("/{id}/homework")
    public Result<List<Homework>> homework(@PathVariable Long id) {
        return Result.success(chapterService.getHomeworkByChapter(id));
    }
}
