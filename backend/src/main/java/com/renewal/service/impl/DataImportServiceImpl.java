package com.renewal.service.impl;

import com.renewal.dto.DataImportRequest;
import com.renewal.dto.DataImportRequest.RawStudentRecord;
import com.renewal.dto.DataImportResultDTO;
import com.renewal.entity.Course;
import com.renewal.entity.DataImportLog;
import com.renewal.entity.DataImportLog.ImportStatus;
import com.renewal.entity.DataImportLog.SourceType;
import com.renewal.entity.Enrollment;
import com.renewal.entity.Enrollment.EnrollmentStatus;
import com.renewal.entity.RenewalFunnelStage;
import com.renewal.entity.RenewalFunnelStage.FunnelStage;
import com.renewal.entity.Student;
import com.renewal.entity.Student.StudentStatus;
import com.renewal.repository.CourseRepository;
import com.renewal.repository.DataImportLogRepository;
import com.renewal.repository.EnrollmentRepository;
import com.renewal.repository.RenewalFunnelStageRepository;
import com.renewal.repository.StudentRepository;
import com.renewal.service.DataImportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class DataImportServiceImpl implements DataImportService {

    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final RenewalFunnelStageRepository funnelStageRepository;
    private final DataImportLogRepository importLogRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String CACHE_KEY_PREFIX = "funnel:";
    private static final long CACHE_TTL_HOURS = 2;
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @Override
    @Transactional
    public DataImportResultDTO importAndClean(DataImportRequest request) {
        SourceType source = SourceType.valueOf(request.getSource());
        DataImportLog importLog = new DataImportLog();
        importLog.setSource(source);
        importLog.setBatchId(request.getBatchId());
        importLog.setRawCount(request.getRecords().size());
        importLog.setStatus(ImportStatus.processing);
        importLog = importLogRepository.save(importLog);

        int cleanedCount = 0;
        int duplicateCount = 0;
        int mismatchCount = 0;

        try {
            for (RawStudentRecord record : request.getRecords()) {
                if (isInvalidRecord(record)) {
                    mismatchCount++;
                    continue;
                }

                if (studentRepository.existsBySourceAndSourceId(source, record.getSourceId())) {
                    duplicateCount++;
                    continue;
                }

                Student student = new Student();
                student.setStudentName(record.getStudentName());
                student.setPhone(record.getPhone());
                student.setParentName(record.getParentName());
                student.setParentPhone(record.getParentPhone());
                student.setGrade(record.getGrade());
                student.setSchool(record.getSchool());
                student.setSource(source);
                student.setSourceId(record.getSourceId());
                student.setStatus(StudentStatus.active);
                student = studentRepository.save(student);

                Course course = findOrCreateCourse(record.getCourseName(), record.getTotalChapters());

                Enrollment enrollment = new Enrollment();
                enrollment.setStudentId(student.getId());
                enrollment.setCourseId(course.getId());
                enrollment.setEnrollDate(LocalDate.parse(record.getEnrollDate(), DATE_FMT));
                enrollment.setExpireDate(LocalDate.parse(record.getExpireDate(), DATE_FMT));
                enrollment.setCurrentChapter(record.getCurrentChapter() != null ? record.getCurrentChapter() : 0);
                enrollment.setCompletionRate(calcCompletionRate(record.getCurrentChapter(), record.getTotalChapters()));
                enrollment.setStatus(EnrollmentStatus.ongoing);
                enrollment = enrollmentRepository.save(enrollment);

                RenewalFunnelStage stage = new RenewalFunnelStage();
                stage.setEnrollmentId(enrollment.getId());
                stage.setStage(determineInitialStage(enrollment));
                stage.setStageEnteredAt(LocalDateTime.now());
                funnelStageRepository.save(stage);

                cleanedCount++;
            }

            importLog.setCleanedCount(cleanedCount);
            importLog.setDuplicateCount(duplicateCount);
            importLog.setMismatchCount(mismatchCount);
            importLog.setStatus(ImportStatus.completed);
            importLogRepository.save(importLog);

            invalidateFunnelCache();

        } catch (Exception e) {
            log.error("Data import failed for batch {}", request.getBatchId(), e);
            importLog.setStatus(ImportStatus.failed);
            importLog.setErrorMessage(e.getMessage());
            importLogRepository.save(importLog);
        }

        DataImportResultDTO result = new DataImportResultDTO();
        result.setLogId(importLog.getId());
        result.setBatchId(importLog.getBatchId());
        result.setRawCount(importLog.getRawCount());
        result.setCleanedCount(cleanedCount);
        result.setDuplicateCount(duplicateCount);
        result.setMismatchCount(mismatchCount);
        result.setStatus(importLog.getStatus().name());
        result.setErrorMessage(importLog.getErrorMessage());
        return result;
    }

    private boolean isInvalidRecord(RawStudentRecord record) {
        return record.getStudentName() == null || record.getStudentName().isBlank()
                || record.getSourceId() == null || record.getSourceId().isBlank()
                || record.getEnrollDate() == null || record.getExpireDate() == null;
    }

    private Course findOrCreateCourse(String courseName, Integer totalChapters) {
        List<Course> courses = courseRepository.findAll();
        Optional<Course> existing = courses.stream()
                .filter(c -> c.getCourseName().equals(courseName))
                .findFirst();
        if (existing.isPresent()) {
            return existing.get();
        }
        Course course = new Course();
        course.setCourseName(courseName);
        course.setTotalChapters(totalChapters != null ? totalChapters : 0);
        course.setStatus(Course.CourseStatus.active);
        return courseRepository.save(course);
    }

    private BigDecimal calcCompletionRate(Integer currentChapter, Integer totalChapters) {
        if (totalChapters == null || totalChapters == 0 || currentChapter == null) {
            return BigDecimal.ZERO;
        }
        return BigDecimal.valueOf(currentChapter)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(totalChapters), 2, RoundingMode.HALF_UP);
    }

    private FunnelStage determineInitialStage(Enrollment enrollment) {
        LocalDate now = LocalDate.now();
        long daysToExpire = java.time.temporal.ChronoUnit.DAYS.between(now, enrollment.getExpireDate());
        if (daysToExpire <= 0) {
            return FunnelStage.near_expire;
        }
        if (daysToExpire <= 30) {
            return FunnelStage.near_expire;
        }
        return FunnelStage.in_course;
    }

    private void invalidateFunnelCache() {
        redisTemplate.delete(CACHE_KEY_PREFIX + "dashboard");
        redisTemplate.delete(CACHE_KEY_PREFIX + "details");
    }
}
