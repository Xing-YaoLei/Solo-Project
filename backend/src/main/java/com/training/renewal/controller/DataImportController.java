package com.training.renewal.controller;

import com.training.renewal.common.Result;
import com.training.renewal.entity.AcademicRecord;
import com.training.renewal.entity.ParentFeedback;
import com.training.renewal.entity.StudentEnrollment;
import com.training.renewal.service.DataImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/import")
@RequiredArgsConstructor
public class DataImportController {

    private final DataImportService importService;

    @PostMapping("/enrollment")
    public Result<Map<String, Integer>> importEnrollment(
            @RequestBody List<StudentEnrollment> dataList,
            @RequestParam(required = false) String operatorId,
            @RequestParam(required = false) String operatorName,
            @RequestParam(required = false) String remark) {
        return Result.success(importService.importEnrollmentData(
                dataList, operatorId, operatorName, remark));
    }

    @PostMapping("/academic")
    public Result<Map<String, Integer>> importAcademic(
            @RequestBody List<AcademicRecord> dataList,
            @RequestParam(required = false) String operatorId,
            @RequestParam(required = false) String operatorName,
            @RequestParam(required = false) String remark) {
        return Result.success(importService.importAcademicData(
                dataList, operatorId, operatorName, remark));
    }

    @PostMapping("/feedback")
    public Result<Map<String, Integer>> importFeedback(
            @RequestBody List<ParentFeedback> dataList,
            @RequestParam(required = false) String operatorId,
            @RequestParam(required = false) String operatorName,
            @RequestParam(required = false) String remark) {
        return Result.success(importService.importFeedbackData(
                dataList, operatorId, operatorName, remark));
    }

    @PostMapping("/merge")
    public Result<List<StudentEnrollment>> mergeStudentData(
            @RequestBody List<String> studentNos) {
        return Result.success(importService.mergeStudentData(studentNos));
    }
}
