package com.trial.booking.controller;

import com.trial.booking.common.ApiResponse;
import com.trial.booking.entity.Teacher;
import com.trial.booking.service.TeacherService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teachers")
@RequiredArgsConstructor
public class TeacherController {

    private final TeacherService teacherService;

    @GetMapping
    public ApiResponse<List<Teacher>> getAll() {
        return ApiResponse.success(teacherService.getAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<Teacher> getById(@PathVariable Long id) {
        return ApiResponse.success(teacherService.getById(id));
    }
}
