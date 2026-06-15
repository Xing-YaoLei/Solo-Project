package com.renewal.service.impl;

import com.renewal.dto.ChapterProgressDTO;
import com.renewal.dto.ChapterProgressDTO.ChapterProgressItem;
import com.renewal.entity.Course;
import com.renewal.entity.Enrollment;
import com.renewal.entity.Enrollment.EnrollmentStatus;
import com.renewal.entity.RenewalFunnelStage;
import com.renewal.entity.Student;
import com.renewal.repository.CourseRepository;
import com.renewal.repository.EnrollmentRepository;
import com.renewal.repository.RenewalFunnelStageRepository;
import com.renewal.repository.StudentRepository;
import com.renewal.service.ChapterService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChapterServiceImpl implements ChapterService {

    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final StudentRepository studentRepository;
    private final RenewalFunnelStageRepository funnelStageRepository;

    @Override
    public List<ChapterProgressDTO> getAllChapterProgress() {
        List<Course> courses = courseRepository.findAll();
        return courses.stream()
                .map(c -> getChapterProgress(c.getId()))
                .collect(Collectors.toList());
    }

    @Override
    public ChapterProgressDTO getChapterProgress(Long courseId) {
        ChapterProgressDTO dto = new ChapterProgressDTO();
        Optional<Course> courseOpt = courseRepository.findById(courseId);
        if (courseOpt.isEmpty()) {
            return dto;
        }

        Course course = courseOpt.get();
        dto.setCourseId(courseId);
        dto.setCourseName(course.getCourseName());
        dto.setTotalChapters(course.getTotalChapters());

        List<Enrollment> enrollments = enrollmentRepository.findByCourseId(courseId).stream()
                .filter(e -> e.getStatus() == EnrollmentStatus.ongoing)
                .collect(Collectors.toList());

        List<ChapterProgressItem> items = new ArrayList<>();
        for (Enrollment e : enrollments) {
            ChapterProgressItem item = new ChapterProgressItem();
            item.setEnrollmentId(e.getId());
            item.setCurrentChapter(e.getCurrentChapter());
            item.setCompletionRate(e.getCompletionRate());
            item.setDaysToExpire((int) ChronoUnit.DAYS.between(LocalDate.now(), e.getExpireDate()));

            studentRepository.findById(e.getStudentId()).ifPresent(s ->
                    item.setStudentName(s.getStudentName()));

            List<RenewalFunnelStage> stages = funnelStageRepository
                    .findByEnrollmentIdOrderByStageEnteredAtDesc(e.getId());
            stages.stream().filter(s -> s.getStageExitedAt() == null).findFirst()
                    .ifPresent(s -> item.setStage(s.getStage().name()));

            items.add(item);
        }

        dto.setStudents(items);
        return dto;
    }
}
