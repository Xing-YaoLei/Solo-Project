package com.renewal.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ReminderRuleDTO {

    private Long id;
    private String ruleName;
    private String ruleType;
    private BigDecimal thresholdValue;
    private String comparison;
    private Integer priority;
    private Boolean isActive;
    private String description;
    private List<TriggerLogItem> recentTriggers;

    @Data
    public static class TriggerLogItem {
        private Long id;
        private Long enrollmentId;
        private String studentName;
        private LocalDateTime triggeredAt;
        private BigDecimal actualValue;
        private Boolean isAnomaly;
        private String remark;
        private String operator;
    }
}
