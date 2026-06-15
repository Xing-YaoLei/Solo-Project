package com.renewal.service.impl;

import com.renewal.dto.EnrollmentDetailDTO;
import com.renewal.dto.FunnelDashboardDTO;
import com.renewal.dto.FunnelDashboardDTO.FunnelStageItem;
import com.renewal.dto.FunnelDashboardDTO.FunnelSummary;
import com.renewal.entity.Course;
import com.renewal.entity.Enrollment;
import com.renewal.entity.Enrollment.EnrollmentStatus;
import com.renewal.entity.RenewalFunnelStage;
import com.renewal.entity.RenewalFunnelStage.FunnelStage;
import com.renewal.entity.Student;
import com.renewal.repository.CourseRepository;
import com.renewal.repository.EnrollmentRepository;
import com.renewal.repository.RenewalFunnelStageRepository;
import com.renewal.repository.StudentRepository;
import com.renewal.service.FunnelService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FunnelServiceImpl implements FunnelService {

    private final EnrollmentRepository enrollmentRepository;
    private final RenewalFunnelStageRepository funnelStageRepository;
    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String CACHE_KEY_DASHBOARD = "funnel:dashboard";
    private static final long CACHE_TTL_HOURS = 2;

    private static final Map<FunnelStage, String> STAGE_LABELS = new LinkedHashMap<>();

    static {
        STAGE_LABELS.put(FunnelStage.in_course, "在课中");
        STAGE_LABELS.put(FunnelStage.near_expire, "即将到期");
        STAGE_LABELS.put(FunnelStage.reminded, "已提醒");
        STAGE_LABELS.put(FunnelStage.negotiating, "沟通中");
        STAGE_LABELS.put(FunnelStage.renewed, "已续费");
        STAGE_LABELS.put(FunnelStage.lost, "已流失");
    }

    @Override
    @SuppressWarnings("unchecked")
    public FunnelDashboardDTO getDashboard() {
        FunnelDashboardDTO cached = (FunnelDashboardDTO) redisTemplate.opsForValue().get(CACHE_KEY_DASHBOARD);
        if (cached != null) {
            return cached;
        }

        FunnelDashboardDTO dashboard = new FunnelDashboardDTO();
        List<FunnelStageItem> stageItems = new ArrayList<>();

        long firstStageCount = -1;
        for (Map.Entry<FunnelStage, String> entry : STAGE_LABELS.entrySet()) {
            long count = funnelStageRepository.countByStageAndStageExitedAtIsNull(entry.getKey());
            if (firstStageCount < 0) {
                firstStageCount = count;
            }

            FunnelStageItem item = new FunnelStageItem();
            item.setStage(entry.getKey().name());
            item.setStageLabel(entry.getValue());
            item.setCount(count);
            stageItems.add(item);
        }

        for (int i = 0; i < stageItems.size(); i++) {
            FunnelStageItem current = stageItems.get(i);
            if (i == 0) {
                current.setConversionRate(BigDecimal.ONE);
                current.setCumulativeRate(BigDecimal.ONE);
            } else {
                FunnelStageItem prev = stageItems.get(i - 1);
                if (prev.getCount() > 0) {
                    current.setConversionRate(
                            BigDecimal.valueOf(current.getCount())
                                    .divide(BigDecimal.valueOf(prev.getCount()), 4, RoundingMode.HALF_UP)
                    );
                } else {
                    current.setConversionRate(BigDecimal.ZERO);
                }
                if (firstStageCount > 0) {
                    current.setCumulativeRate(
                            BigDecimal.valueOf(current.getCount())
                                    .divide(BigDecimal.valueOf(firstStageCount), 4, RoundingMode.HALF_UP)
                    );
                } else {
                    current.setCumulativeRate(BigDecimal.ZERO);
                }
            }
        }

        dashboard.setStages(stageItems);

        FunnelSummary summary = new FunnelSummary();
        long ongoingCount = enrollmentRepository.countByStatus(EnrollmentStatus.ongoing);
        long renewedCount = funnelStageRepository.countByStageAndStageExitedAtIsNull(FunnelStage.renewed);
        long lostCount = funnelStageRepository.countByStageAndStageExitedAtIsNull(FunnelStage.lost);
        summary.setTotalEnrollments(ongoingCount + renewedCount + lostCount);
        summary.setRenewedCount(renewedCount);
        summary.setLostCount(lostCount);
        if (summary.getTotalEnrollments() > 0) {
            summary.setOverallRenewalRate(
                    BigDecimal.valueOf(renewedCount)
                            .divide(BigDecimal.valueOf(summary.getTotalEnrollments()), 4, RoundingMode.HALF_UP)
                            .multiply(BigDecimal.valueOf(100))
            );
        } else {
            summary.setOverallRenewalRate(BigDecimal.ZERO);
        }

        List<Enrollment> enrollments = enrollmentRepository.findByStatus(EnrollmentStatus.ongoing);
        if (!enrollments.isEmpty()) {
            BigDecimal totalRate = enrollments.stream()
                    .map(Enrollment::getCompletionRate)
                    .filter(r -> r != null)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            summary.setOverallCompletionRate(
                    totalRate.divide(BigDecimal.valueOf(enrollments.size()), 2, RoundingMode.HALF_UP)
            );
        } else {
            summary.setOverallCompletionRate(BigDecimal.ZERO);
        }

        dashboard.setSummary(summary);
        redisTemplate.opsForValue().set(CACHE_KEY_DASHBOARD, dashboard, CACHE_TTL_HOURS, TimeUnit.HOURS);
        return dashboard;
    }

    @Override
    public List<EnrollmentDetailDTO> getEnrollmentDetails(String stage) {
        List<RenewalFunnelStage> stages;
        if (stage != null && !stage.isBlank()) {
            FunnelStage funnelStage = FunnelStage.valueOf(stage);
            stages = funnelStageRepository.findByEnrollmentIdOrderByStageEnteredAtDesc(0L).isEmpty()
                    ? List.of()
                    : funnelStageRepository.countByStageAndStageExitedAtIsNull(funnelStage) > 0
                    ? getActiveStagesByStage(funnelStage)
                    : List.of();
        } else {
            stages = funnelStageRepository.findAll().stream()
                    .filter(s -> s.getStageExitedAt() == null)
                    .collect(Collectors.toList());
        }

        return stages.stream().map(s -> {
            EnrollmentDetailDTO dto = new EnrollmentDetailDTO();
            dto.setEnrollmentId(s.getEnrollmentId());
            dto.setCurrentStage(s.getStage().name());

            Optional<Enrollment> enrollmentOpt = enrollmentRepository.findById(s.getEnrollmentId());
            enrollmentOpt.ifPresent(e -> {
                dto.setStudentId(e.getStudentId());
                dto.setCourseId(e.getCourseId());
                dto.setEnrollDate(e.getEnrollDate());
                dto.setExpireDate(e.getExpireDate());
                dto.setCurrentChapter(e.getCurrentChapter());
                dto.setCompletionRate(e.getCompletionRate());
                dto.setDaysToExpire((int) ChronoUnit.DAYS.between(LocalDate.now(), e.getExpireDate()));

                studentRepository.findById(e.getStudentId()).ifPresent(st -> {
                    dto.setStudentName(st.getStudentName());
                    dto.setParentPhone(st.getParentPhone());
                });

                courseRepository.findById(e.getCourseId()).ifPresent(c -> {
                    dto.setCourseName(c.getCourseName());
                    dto.setTotalChapters(c.getTotalChapters());
                });
            });

            return dto;
        }).sorted(Comparator.comparing(EnrollmentDetailDTO::getDaysToExpire, Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());
    }

    private List<RenewalFunnelStage> getActiveStagesByStage(FunnelStage stage) {
        return funnelStageRepository.findAll().stream()
                .filter(s -> s.getStage() == stage && s.getStageExitedAt() == null)
                .collect(Collectors.toList());
    }
}
