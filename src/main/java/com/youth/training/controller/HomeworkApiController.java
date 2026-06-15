package com.youth.training.controller;

import com.youth.training.common.Result;
import com.youth.training.entity.Homework;
import com.youth.training.entity.Question;
import com.youth.training.service.HomeworkService;
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
@RequestMapping("/api/homework")
@RequiredArgsConstructor
public class HomeworkApiController {

    private final HomeworkService homeworkService;

    @GetMapping("/course/{courseId}")
    public Result<List<Homework>> listByCourse(@PathVariable Long courseId) {
        return Result.success(homeworkService.listHomeworkByCourse(courseId));
    }

    @GetMapping("/chapter/{chapterId}")
    public Result<List<Homework>> listByChapter(@PathVariable Long chapterId) {
        return Result.success(homeworkService.listHomeworkByChapter(chapterId));
    }

    @GetMapping("/{id}")
    public Result<Homework> detail(@PathVariable Long id) {
        return Result.success(homeworkService.getHomework(id));
    }

    @PostMapping("/")
    public Result<Homework> create(@RequestBody Homework homework) {
        return Result.success(homeworkService.createHomework(homework));
    }

    @PutMapping("/{id}")
    public Result<Homework> update(@PathVariable Long id, @RequestBody Homework homework) {
        return Result.success(homeworkService.updateHomework(id, homework));
    }

    @DeleteMapping("/{id}")
    public Result<Homework> delete(@PathVariable Long id) {
        return Result.success(homeworkService.deleteHomework(id));
    }

    @GetMapping("/{id}/questions")
    public Result<List<Question>> questions(@PathVariable Long id) {
        return Result.success(homeworkService.getQuestionsByHomework(id));
    }
}
