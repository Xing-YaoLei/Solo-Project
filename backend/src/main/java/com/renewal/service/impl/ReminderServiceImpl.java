package com.renewal.service.impl;

import com.renewal.dto.RemarkRequest;
import com.renewal.dto.ReminderRuleDTO;
import com.renewal.dto.ReminderRuleDTO.TriggerLogItem;
import com.renewal.entity.Enrollment;
import com.renewal.entity.ReminderRule;
import com.renewal.entity.ReminderTriggerLog;
import com.renewal.entity.Student;
import com.renewal.repository.EnrollmentRepository;
import com.renewal.repository.ReminderRuleRepository;
import com.renewal.repository.ReminderTriggerLogRepository;
import com.renewal.repository.StudentRepository;
import com.renewal.service.ReminderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReminderServiceImpl implements ReminderService {

    private final ReminderRuleRepository ruleRepository;
    private final ReminderTriggerLogRepository triggerLogRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final StudentRepository studentRepository;

    private static final DateTimeFormatter DT_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Override
    public List<ReminderRuleDTO> getActiveRules() {
        return ruleRepository.findByIsActiveTrueOrderByPriorityDesc().stream()
                .map(this::toRuleDTO)
                .collect(Collectors.toList());
    }

    @Override
    public ReminderRuleDTO getRuleDetail(Long ruleId) {
        ReminderRule rule = ruleRepository.findById(ruleId).orElseThrow();
        ReminderRuleDTO dto = toRuleDTO(rule);

        List<ReminderTriggerLog> recentLogs = triggerLogRepository.findAll().stream()
                .filter(l -> l.getRuleId().equals(ruleId))
                .sorted((a, b) -> b.getTriggeredAt().compareTo(a.getTriggeredAt()))
                .limit(20)
                .collect(Collectors.toList());

        dto.setRecentTriggers(recentLogs.stream().map(this::toTriggerLogItem).collect(Collectors.toList()));
        return dto;
    }

    @Override
    @Transactional
    public ReminderRuleDTO updateRule(ReminderRuleDTO ruleDTO) {
        ReminderRule rule;
        if (ruleDTO.getId() != null) {
            rule = ruleRepository.findById(ruleDTO.getId()).orElse(new ReminderRule());
        } else {
            rule = new ReminderRule();
        }

        if (ruleDTO.getRuleName() != null) rule.setRuleName(ruleDTO.getRuleName());
        if (ruleDTO.getRuleType() != null) rule.setRuleType(ReminderRule.RuleType.valueOf(ruleDTO.getRuleType()));
        if (ruleDTO.getThresholdValue() != null) rule.setThresholdValue(ruleDTO.getThresholdValue());
        if (ruleDTO.getComparison() != null) rule.setComparison(ReminderRule.Comparison.valueOf(ruleDTO.getComparison()));
        if (ruleDTO.getPriority() != null) rule.setPriority(ruleDTO.getPriority());
        if (ruleDTO.getIsActive() != null) rule.setIsActive(ruleDTO.getIsActive());
        if (ruleDTO.getDescription() != null) rule.setDescription(ruleDTO.getDescription());

        rule = ruleRepository.save(rule);
        return toRuleDTO(rule);
    }

    @Override
    @Transactional
    public void addRemark(RemarkRequest request) {
        ReminderTriggerLog log = triggerLogRepository.findById(request.getTriggerLogId()).orElseThrow();
        log.setRemark(request.getRemark());
        log.setOperator(request.getOperator());
        log.setIsAnomaly(true);
        triggerLogRepository.save(log);
    }

    @Override
    public List<TriggerLogItem> getAnomalyLogs(String startDate, String endDate) {
        LocalDateTime start = LocalDateTime.parse(startDate + " 00:00:00", DT_FMT);
        LocalDateTime end = LocalDateTime.parse(endDate + " 23:59:59", DT_FMT);
        return triggerLogRepository.findAnomaliesBetween(start, end).stream()
                .map(this::toTriggerLogItem)
                .collect(Collectors.toList());
    }

    private ReminderRuleDTO toRuleDTO(ReminderRule rule) {
        ReminderRuleDTO dto = new ReminderRuleDTO();
        dto.setId(rule.getId());
        dto.setRuleName(rule.getRuleName());
        dto.setRuleType(rule.getRuleType().name());
        dto.setThresholdValue(rule.getThresholdValue());
        dto.setComparison(rule.getComparison().name());
        dto.setPriority(rule.getPriority());
        dto.setIsActive(rule.getIsActive());
        dto.setDescription(rule.getDescription());
        return dto;
    }

    private TriggerLogItem toTriggerLogItem(ReminderTriggerLog log) {
        TriggerLogItem item = new TriggerLogItem();
        item.setId(log.getId());
        item.setEnrollmentId(log.getEnrollmentId());
        item.setTriggeredAt(log.getTriggeredAt());
        item.setActualValue(log.getActualValue());
        item.setIsAnomaly(log.getIsAnomaly());
        item.setRemark(log.getRemark());
        item.setOperator(log.getOperator());

        Optional<Enrollment> enrollmentOpt = enrollmentRepository.findById(log.getEnrollmentId());
        enrollmentOpt.ifPresent(e -> {
            studentRepository.findById(e.getStudentId()).ifPresent(s ->
                    item.setStudentName(s.getStudentName()));
        });

        return item;
    }
}
