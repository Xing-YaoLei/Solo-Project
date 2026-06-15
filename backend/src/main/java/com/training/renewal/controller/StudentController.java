package com.training.renewal.controller;

import com.training.renewal.common.Result;
import com.training.renewal.entity.StudentEnrollment;
import com.training.renewal.repository.StudentEnrollmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/students")
@RequiredArgsConstructor
public class StudentController {

    private final StudentEnrollmentRepository studentRepository;

    @GetMapping("/{studentNo}")
    public Result<StudentEnrollment> getStudent(@PathVariable String studentNo) {
        return studentRepository.findByStudentNo(studentNo)
                .map(Result::success)
                .orElse(Result.error("学生不存在"));
    }

    @GetMapping
    public Result<Page<StudentEnrollment>> getStudents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String consultantId,
            @RequestParam(required = false) String courseTag,
            @RequestParam(required = false) String grade) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createTime"));

        Page<StudentEnrollment> students;
        if (consultantId != null) {
            students = studentRepository.findAll(
                    (root, query, cb) -> cb.equal(root.get("consultantId"), consultantId),
                    pageable);
        } else if (courseTag != null) {
            students = studentRepository.findAll(
                    (root, query, cb) -> cb.equal(root.get("courseTag"), courseTag),
                    pageable);
        } else if (grade != null) {
            students = studentRepository.findAll(
                    (root, query, cb) -> cb.equal(root.get("grade"), grade),
                    pageable);
        } else {
            students = studentRepository.findAll(pageable);
        }

        return Result.success(students);
    }

    @GetMapping("/consultant/{consultantId}")
    public Result<List<StudentEnrollment>> getStudentsByConsultant(
            @PathVariable String consultantId) {
        return Result.success(studentRepository.findByConsultantId(consultantId));
    }

    @PutMapping("/{studentNo}")
    public Result<StudentEnrollment> updateStudent(
            @PathVariable String studentNo,
            @RequestBody StudentEnrollment student) {
        StudentEnrollment existing = studentRepository.findByStudentNo(studentNo)
                .orElseThrow(() -> new RuntimeException("学生不存在"));

        if (student.getRenewalStatus() != null) {
            existing.setRenewalStatus(student.getRenewalStatus());
        }
        if (student.getCompletionRate() != null) {
            existing.setCompletionRate(student.getCompletionRate());
        }
        if (student.getRemark() != null) {
            existing.setRemark(student.getRemark());
        }

        return Result.success(studentRepository.save(existing));
    }

    @GetMapping("/low-progress")
    public Result<List<StudentEnrollment>> getLowProgressStudents(
            @RequestParam(defaultValue = "20") int limit) {
        return Result.success(studentRepository.findTopByCompletionRateAsc(limit));
    }
}
