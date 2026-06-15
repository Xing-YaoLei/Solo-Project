package com.youth.training.controller;

import com.youth.training.common.Result;
import com.youth.training.entity.Chapter;
import com.youth.training.entity.Course;
import com.youth.training.entity.Homework;
import com.youth.training.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
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
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseApiController {

    private final CourseService courseService;

    @GetMapping("/list")
    public Result<List<Course>> list(@RequestParam(required = false) String status) {
        return Result.success(courseService.listCourses(status));
    }

    @GetMapping("/{id}")
    public Result<Course> detail(@PathVariable Long id) {
        return Result.success(courseService.getCourse(id));
    }

    @PostMapping("/")
    public Result<Course> create(@RequestBody Course course) {
        return Result.success(courseService.createCourse(course));
    }

    @PutMapping("/{id}")
    public Result<Course> update(@PathVariable Long id, @RequestBody Course course) {
        return Result.success(courseService.updateCourse(id, course));
    }

    @DeleteMapping("/{id}")
    public Result<Course> delete(@PathVariable Long id) {
        return Result.success(courseService.deleteCourse(id));
    }

    @GetMapping("/{id}/chapters")
    public Result<List<Chapter>> chapters(@PathVariable Long id) {
        return Result.success(courseService.getChaptersByCourse(id));
    }

    @GetMapping("/{id}/homework")
    public Result<List<Homework>> homework(@PathVariable Long id) {
        return Result.success(courseService.getHomeworkByCourse(id));
    }

    @PostMapping("/{id}/recalculate")
    public Result<Course> recalculate(@PathVariable Long id) {
        return Result.success(courseService.recalculateCourseStats(id));
    }
}
