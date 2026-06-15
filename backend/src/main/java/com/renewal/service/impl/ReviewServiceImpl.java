package com.renewal.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.renewal.dto.ReviewGenerateRequest;
import com.renewal.dto.ReviewMaterialDTO;
import com.renewal.entity.Enrollment;
import com.renewal.entity.Enrollment.EnrollmentStatus;
import com.renewal.entity.ReminderTriggerLog;
import com.renewal.entity.ReviewMaterial;
import com.renewal.entity.RenewalFunnelStage.FunnelStage;
import com.renewal.entity.ThresholdConfig;
import com.renewal.repository.EnrollmentRepository;
import com.renewal.repository.ReminderTriggerLogRepository;
import com.renewal.repository.RenewalFunnelStageRepository;
import com.renewal.repository.ReviewMaterialRepository;
import com.renewal.repository.ThresholdConfigRepository;
import com.renewal.service.ReviewService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewMaterialRepository reviewMaterialRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final RenewalFunnelStageRepository funnelStageRepository;
    private final ReminderTriggerLogRepository triggerLogRepository;
    private final ThresholdConfigRepository thresholdConfigRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public ReviewMaterialDTO generateReview(ReviewGenerateRequest request) {
        ReviewMaterial material = new ReviewMaterial();
        material.setTitle("续费复盘 - " + request.getPeriodStart() + " 至 " + request.getPeriodEnd());
        material.setPeriodStart(request.getPeriodStart());
        material.setPeriodEnd(request.getPeriodEnd());
        material.setCreatedBy(request.getCreatedBy());
        material.setStatus(ReviewMaterial.ReviewStatus.draft);

        List<Enrollment> enrollments = enrollmentRepository.findByStatus(EnrollmentStatus.ongoing);
        material.setTotalEnrollments(enrollments.size());

        long renewedCount = funnelStageRepository.countByStageAndStageExitedAtIsNull(FunnelStage.renewed);
        long lostCount = funnelStageRepository.countByStageAndStageExitedAtIsNull(FunnelStage.lost);
        material.setRenewedCount((int) renewedCount);
        material.setLostCount((int) lostCount);

        if (!enrollments.isEmpty()) {
            BigDecimal totalCompletion = enrollments.stream()
                    .map(Enrollment::getCompletionRate)
                    .filter(r -> r != null)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            material.setOverallCompletionRate(
                    totalCompletion.divide(BigDecimal.valueOf(enrollments.size()), 2, RoundingMode.HALF_UP)
            );
        }

        material.setFunnelSummary(buildFunnelSummary());
        material.setAnomalySummary(buildAnomalySummary(request.getPeriodStart(), request.getPeriodEnd()));
        material.setKeyFindings(buildKeyFindings(material));
        material.setActionItems(buildActionItems(material));

        material = reviewMaterialRepository.save(material);
        return toDTO(material);
    }

    @Override
    public ReviewMaterialDTO getReview(Long id) {
        return toDTO(reviewMaterialRepository.findById(id).orElseThrow());
    }

    @Override
    public List<ReviewMaterialDTO> listReviews(String status) {
        if (status != null && !status.isBlank()) {
            ReviewMaterial.ReviewStatus reviewStatus = ReviewMaterial.ReviewStatus.valueOf(status);
            return reviewMaterialRepository.findByStatusOrderByCreatedAtDesc(reviewStatus).stream()
                    .map(this::toDTO)
                    .collect(Collectors.toList());
        }
        return reviewMaterialRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ReviewMaterialDTO publishReview(Long id) {
        ReviewMaterial material = reviewMaterialRepository.findById(id).orElseThrow();
        material.setStatus(ReviewMaterial.ReviewStatus.published);
        material = reviewMaterialRepository.save(material);
        return toDTO(material);
    }

    private String buildFunnelSummary() {
        Map<String, Long> summary = new LinkedHashMap<>();
        for (FunnelStage stage : FunnelStage.values()) {
            long count = funnelStageRepository.countByStageAndStageExitedAtIsNull(stage);
            summary.put(stage.name(), count);
        }
        try {
            return objectMapper.writeValueAsString(summary);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }

    private String buildAnomalySummary(LocalDate start, LocalDate end) {
        LocalDateTime startTime = start.atStartOfDay();
        LocalDateTime endTime = end.atTime(LocalTime.MAX);
        List<ReminderTriggerLog> anomalies = triggerLogRepository.findAnomaliesBetween(startTime, endTime);

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalAnomalies", anomalies.size());
        summary.put("anomaliesWithRemarks", anomalies.stream().filter(a -> a.getRemark() != null).count());
        summary.put("anomaliesWithoutRemarks", anomalies.stream().filter(a -> a.getRemark() == null).count());

        List<Map<String, Object>> anomalyDetails = anomalies.stream().map(a -> {
            Map<String, Object> detail = new HashMap<>();
            detail.put("id", a.getId());
            detail.put("enrollmentId", a.getEnrollmentId());
            detail.put("ruleId", a.getRuleId());
            detail.put("actualValue", a.getActualValue());
            detail.put("remark", a.getRemark());
            detail.put("operator", a.getOperator());
            detail.put("triggeredAt", a.getTriggeredAt().toString());
            return detail;
        }).collect(Collectors.toList());
        summary.put("details", anomalyDetails);

        try {
            return objectMapper.writeValueAsString(summary);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }

    private String buildKeyFindings(ReviewMaterial material) {
        StringBuilder sb = new StringBuilder();
        sb.append("【完成率分析】\n");
        sb.append("整体完成率: ").append(material.getOverallCompletionRate()).append("%\n");

        BigDecimal completionWarning = thresholdConfigRepository.findByConfigKey("completion_rate_warning")
                .map(ThresholdConfig::getConfigValue)
                .orElse(BigDecimal.valueOf(60));

        long belowWarning = enrollmentRepository.findByStatus(EnrollmentStatus.ongoing).stream()
                .filter(e -> e.getCompletionRate() != null && e.getCompletionRate().compareTo(completionWarning) < 0)
                .count();
        sb.append("完成率低于预警线(").append(completionWarning).append("%)的学员数: ").append(belowWarning).append("\n\n");

        sb.append("【续费转化分析】\n");
        if (material.getTotalEnrollments() > 0) {
            BigDecimal renewalRate = BigDecimal.valueOf(material.getRenewedCount())
                    .multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(material.getTotalEnrollments()), 2, RoundingMode.HALF_UP);
            sb.append("续费转化率: ").append(renewalRate).append("%\n");
        }
        sb.append("已续费: ").append(material.getRenewedCount()).append("\n");
        sb.append("已流失: ").append(material.getLostCount()).append("\n");

        return sb.toString();
    }

    private String buildActionItems(ReviewMaterial material) {
        StringBuilder sb = new StringBuilder();
        sb.append("1. 对完成率低于预警线的学员安排一对一面谈\n");
        sb.append("2. 对即将到期的学员加强续费沟通频次\n");
        sb.append("3. 对已流失学员进行回访，了解流失原因\n");
        sb.append("4. 根据异常备注记录优化提醒规则阈值\n");
        return sb.toString();
    }

    private ReviewMaterialDTO toDTO(ReviewMaterial material) {
        ReviewMaterialDTO dto = new ReviewMaterialDTO();
        dto.setId(material.getId());
        dto.setTitle(material.getTitle());
        dto.setPeriodStart(material.getPeriodStart());
        dto.setPeriodEnd(material.getPeriodEnd());
        dto.setTotalEnrollments(material.getTotalEnrollments());
        dto.setRenewedCount(material.getRenewedCount());
        dto.setLostCount(material.getLostCount());
        dto.setOverallCompletionRate(material.getOverallCompletionRate());
        dto.setFunnelSummary(material.getFunnelSummary());
        dto.setAnomalySummary(material.getAnomalySummary());
        dto.setKeyFindings(material.getKeyFindings());
        dto.setActionItems(material.getActionItems());
        dto.setStatus(material.getStatus().name());
        dto.setCreatedBy(material.getCreatedBy());
        return dto;
    }
}
