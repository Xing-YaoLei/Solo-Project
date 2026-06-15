package com.training.renewal.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

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

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRuleName() {
        return ruleName;
    }

    public void setRuleName(String ruleName) {
        this.ruleName = ruleName;
    }

    public String getRuleType() {
        return ruleType;
    }

    public void setRuleType(String ruleType) {
        this.ruleType = ruleType;
    }

    public String getRuleCondition() {
        return ruleCondition;
    }

    public void setRuleCondition(String ruleCondition) {
        this.ruleCondition = ruleCondition;
    }

    public String getRuleAction() {
        return ruleAction;
    }

    public void setRuleAction(String ruleAction) {
        this.ruleAction = ruleAction;
    }

    public Integer getTriggerDaysBefore() {
        return triggerDaysBefore;
    }

    public void setTriggerDaysBefore(Integer triggerDaysBefore) {
        this.triggerDaysBefore = triggerDaysBefore;
    }

    public java.math.BigDecimal getProgressThreshold() {
        return progressThreshold;
    }

    public void setProgressThreshold(java.math.BigDecimal progressThreshold) {
        this.progressThreshold = progressThreshold;
    }

    public java.math.BigDecimal getScoreThreshold() {
        return scoreThreshold;
    }

    public void setScoreThreshold(java.math.BigDecimal scoreThreshold) {
        this.scoreThreshold = scoreThreshold;
    }

    public String getReminderLevel() {
        return reminderLevel;
    }

    public void setReminderLevel(String reminderLevel) {
        this.reminderLevel = reminderLevel;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public LocalDateTime getCreateTime() {
        return createTime;
    }

    public void setCreateTime(LocalDateTime createTime) {
        this.createTime = createTime;
    }

    public LocalDateTime getUpdateTime() {
        return updateTime;
    }

    public void setUpdateTime(LocalDateTime updateTime) {
        this.updateTime = updateTime;
    }

    public String getOperatorId() {
        return operatorId;
    }

    public void setOperatorId(String operatorId) {
        this.operatorId = operatorId;
    }

    public String getOperatorName() {
        return operatorName;
    }

    public void setOperatorName(String operatorName) {
        this.operatorName = operatorName;
    }

    public String getChangeReason() {
        return changeReason;
    }

    public void setChangeReason(String changeReason) {
        this.changeReason = changeReason;
    }
}
