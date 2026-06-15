package com.training.renewal.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "reminder_rule", indexes = {
    @Index(name = "idx_rule_type", columnList = "ruleType"),
    @Index(name = "idx_status", columnList = "status")
})
public class ReminderRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 64)
    private String ruleName;

    @Column(length = 32)
    private String ruleType;

    @Column(columnDefinition = "TEXT")
    private String ruleCondition;

    @Column(columnDefinition = "TEXT")
    private String ruleAction;

    private Integer triggerDaysBefore;

    @Column(precision = 5, scale = 2)
    private java.math.BigDecimal progressThreshold;

    @Column(precision = 5, scale = 2)
    private java.math.BigDecimal scoreThreshold;

    @Column(length = 32)
    private String reminderLevel;

    @Column(length = 16)
    private String status;

    private Integer sortOrder;

    @Column(length = 64)
    private String version;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createTime;

    @UpdateTimestamp
    private LocalDateTime updateTime;

    @Column(length = 32)
    private String operatorId;

    @Column(length = 64)
    private String operatorName;

    @Column(length = 512)
    private String changeReason;
}
