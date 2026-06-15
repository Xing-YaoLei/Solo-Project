package com.renewal.service.impl;

import com.renewal.dto.ScoreChartDTO;
import com.renewal.dto.ScoreChartDTO.ScoreDataPoint;
import com.renewal.entity.Enrollment;
import com.renewal.entity.ScoreFeedback;
import com.renewal.entity.Student;
import com.renewal.entity.Course;
import com.renewal.repository.CourseRepository;
import com.renewal.repository.EnrollmentRepository;
import com.renewal.repository.ScoreFeedbackRepository;
import com.renewal.repository.StudentRepository;
import com.renewal.service.ScoreFeedbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ScoreFeedbackServiceImpl implements ScoreFeedbackService {

    private final ScoreFeedbackRepository scoreFeedbackRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;

    @Override
    public ScoreChartDTO getScoreChart(Long enrollmentId) {
        ScoreChartDTO dto = new ScoreChartDTO();
        dto.setEnrollmentId(enrollmentId);

        fillEnrollmentInfo(dto, enrollmentId);
        fillScoreData(dto, enrollmentId);
        calcStats(dto);

        return dto;
    }

    @Override
    public List<ScoreChartDTO> getBatchScoreCharts(List<Long> enrollmentIds) {
        return enrollmentIds.stream()
                .map(this::getScoreChart)
                .collect(Collectors.toList());
    }

    private void fillEnrollmentInfo(ScoreChartDTO dto, Long enrollmentId) {
        Optional<Enrollment> enrollmentOpt = enrollmentRepository.findById(enrollmentId);
        enrollmentOpt.ifPresent(e -> {
            studentRepository.findById(e.getStudentId()).ifPresent(s ->
                    dto.setStudentName(s.getStudentName()));
            courseRepository.findById(e.getCourseId()).ifPresent(c ->
                    dto.setCourseName(c.getCourseName()));
        });
    }

    private void fillScoreData(ScoreChartDTO dto, Long enrollmentId) {
        List<ScoreFeedback> feedbacks = scoreFeedbackRepository
                .findByEnrollmentIdOrderByRecordedAtDesc(enrollmentId);

        List<ScoreDataPoint> dataPoints = feedbacks.stream().map(f -> {
            ScoreDataPoint point = new ScoreDataPoint();
            point.setRecordedAt(f.getRecordedAt());
            point.setScoreType(f.getScoreType().name());
            point.setScore(f.getScore());
            point.setMaxScore(f.getMaxScore());
            point.setFeedbackText(f.getFeedbackText());
            return point;
        }).sorted(Comparator.comparing(ScoreDataPoint::getRecordedAt))
                .collect(Collectors.toList());

        dto.setDataPoints(dataPoints);
    }

    private void calcStats(ScoreChartDTO dto) {
        List<ScoreDataPoint> points = dto.getDataPoints();
        if (points == null || points.isEmpty()) {
            dto.setAvgScore(BigDecimal.ZERO);
            dto.setMaxScore(BigDecimal.ZERO);
            dto.setMinScore(BigDecimal.ZERO);
            dto.setDropRate(BigDecimal.ZERO);
            return;
        }

        List<BigDecimal> scores = points.stream()
                .map(ScoreDataPoint::getScore)
                .filter(s -> s != null)
                .collect(Collectors.toList());

        if (scores.isEmpty()) {
            return;
        }

        BigDecimal sum = scores.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setAvgScore(sum.divide(BigDecimal.valueOf(scores.size()), 2, RoundingMode.HALF_UP));
        dto.setMaxScore(scores.stream().max(Comparator.naturalOrder()).orElse(BigDecimal.ZERO));
        dto.setMinScore(scores.stream().min(Comparator.naturalOrder()).orElse(BigDecimal.ZERO));

        if (scores.size() >= 2) {
            BigDecimal first = scores.get(0);
            BigDecimal last = scores.get(scores.size() - 1);
            if (first.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal diff = first.subtract(last);
                dto.setDropRate(diff.multiply(BigDecimal.valueOf(100))
                        .divide(first, 2, RoundingMode.HALF_UP));
            }
        } else {
            dto.setDropRate(BigDecimal.ZERO);
        }
    }
}
