package com.youth.training.controller;

import com.youth.training.common.Result;
import com.youth.training.dto.StatusChangeDTO;
import com.youth.training.entity.Student;
import com.youth.training.enums.CommonStatus;
import com.youth.training.repository.StudentRepository;
import com.youth.training.service.StatusHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class StudentApiController {

    private final StudentRepository studentRepository;
    private final StatusHistoryService statusHistoryService;

    @GetMapping("/list")
    public Result<List<Student>> list() {
        return Result.success(studentRepository.findAll(Sort.by(Sort.Direction.DESC, "createTime")));
    }

    @GetMapping("/{id}")
    public Result<Student> detail(@PathVariable Long id) {
        return Result.success(studentRepository.findById(id).orElse(null));
    }

    @PostMapping("/")
    public Result<Student> create(@RequestBody Student student) {
        if (student.getStatus() == null) {
            student.setStatus(CommonStatus.ACTIVE.getCode());
        }
        Student saved = studentRepository.save(student);

        StatusChangeDTO statusDTO = new StatusChangeDTO();
        statusDTO.setBusinessId(saved.getId());
        statusDTO.setBusinessType("STUDENT");
        statusDTO.setOldStatus("");
        statusDTO.setNewStatus(saved.getStatus());
        statusDTO.setChangeReason("新增学生: " + saved.getStudentName());
        statusDTO.setOperator("SYSTEM");
        statusHistoryService.saveStatusHistory(statusDTO);

        return Result.success(saved);
    }

    @PutMapping("/{id}")
    public Result<Student> update(@PathVariable Long id, @RequestBody Student student) {
        Student existing = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("学生不存在: " + id));

        String oldStatus = existing.getStatus();
        student.setId(id);
        student.setCreateTime(existing.getCreateTime());
        Student saved = studentRepository.save(student);

        if (!Objects.equals(oldStatus, student.getStatus()) && student.getStatus() != null) {
            StatusChangeDTO statusDTO = new StatusChangeDTO();
            statusDTO.setBusinessId(saved.getId());
            statusDTO.setBusinessType("STUDENT");
            statusDTO.setOldStatus(oldStatus != null ? oldStatus : "");
            statusDTO.setNewStatus(student.getStatus());
            statusDTO.setChangeReason("学生状态变更: " + saved.getStudentName());
            statusDTO.setOperator("SYSTEM");
            statusHistoryService.saveStatusHistory(statusDTO);
        }

        return Result.success(saved);
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("学生不存在: " + id));

        String oldStatus = student.getStatus();
        student.setStatus(CommonStatus.DELETED.getCode());
        studentRepository.save(student);

        StatusChangeDTO statusDTO = new StatusChangeDTO();
        statusDTO.setBusinessId(id);
        statusDTO.setBusinessType("STUDENT");
        statusDTO.setOldStatus(oldStatus != null ? oldStatus : "");
        statusDTO.setNewStatus(CommonStatus.DELETED.getCode());
        statusDTO.setChangeReason("删除学生: " + student.getStudentName());
        statusDTO.setOperator("SYSTEM");
        statusHistoryService.saveStatusHistory(statusDTO);

        return Result.success(null);
    }
}
