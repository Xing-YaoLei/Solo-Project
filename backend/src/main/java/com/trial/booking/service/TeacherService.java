package com.trial.booking.service;

import com.trial.booking.entity.Teacher;
import com.trial.booking.repository.TeacherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TeacherService {

    private final TeacherRepository teacherRepository;

    public List<Teacher> getAll() {
        return teacherRepository.findByEnabledTrue();
    }

    public List<Teacher> getBySubject(String subject) {
        return teacherRepository.findBySubjectAndEnabledTrue(subject);
    }

    public Teacher getById(Long id) {
        return teacherRepository.findById(id).orElseThrow(() -> new RuntimeException("Teacher not found"));
    }
}
