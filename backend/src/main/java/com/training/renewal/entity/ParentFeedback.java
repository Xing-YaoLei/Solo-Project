package com.training.renewal.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "parent_feedback", indexes = {
    @Index(name = "idx_student_no", columnList = "studentNo"),
    @Index(name = "idx_batch_id", columnList = "batchId"),
    @Index(name = "idx_feedback_time", columnList = "feedbackTime"),
    @Index(name = "idx_feedback_type", columnList = "feedbackType")
})
public class ParentFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 32)
    private String batchId;

    @Column(length = 32)
    private String studentNo;

    @Column(length = 64)
    private String parentName;

    @Column(length = 16)
    private String feedbackType;

    @Column(length = 32)
    private String feedbackChannel;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(length = 16)
    private String sentiment;

    private Integer score;

    private LocalDateTime feedbackTime;

    @Column(length = 64)
    private String handlerId;

    @Column(length = 64)
    private String handlerName;

    @Column(length = 16)
    private String handleStatus;

    @Column(columnDefinition = "TEXT")
    private String handleResult;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createTime;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getBatchId() {
        return batchId;
    }

    public void setBatchId(String batchId) {
        this.batchId = batchId;
    }

    public String getStudentNo() {
        return studentNo;
    }

    public void setStudentNo(String studentNo) {
        this.studentNo = studentNo;
    }

    public String getParentName() {
        return parentName;
    }

    public void setParentName(String parentName) {
        this.parentName = parentName;
    }

    public String getFeedbackType() {
        return feedbackType;
    }

    public void setFeedbackType(String feedbackType) {
        this.feedbackType = feedbackType;
    }

    public String getFeedbackChannel() {
        return feedbackChannel;
    }

    public void setFeedbackChannel(String feedbackChannel) {
        this.feedbackChannel = feedbackChannel;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getSentiment() {
        return sentiment;
    }

    public void setSentiment(String sentiment) {
        this.sentiment = sentiment;
    }

    public Integer getScore() {
        return score;
    }

    public void setScore(Integer score) {
        this.score = score;
    }

    public LocalDateTime getFeedbackTime() {
        return feedbackTime;
    }

    public void setFeedbackTime(LocalDateTime feedbackTime) {
        this.feedbackTime = feedbackTime;
    }

    public String getHandlerId() {
        return handlerId;
    }

    public void setHandlerId(String handlerId) {
        this.handlerId = handlerId;
    }

    public String getHandlerName() {
        return handlerName;
    }

    public void setHandlerName(String handlerName) {
        this.handlerName = handlerName;
    }

    public String getHandleStatus() {
        return handleStatus;
    }

    public void setHandleStatus(String handleStatus) {
        this.handleStatus = handleStatus;
    }

    public String getHandleResult() {
        return handleResult;
    }

    public void setHandleResult(String handleResult) {
        this.handleResult = handleResult;
    }

    public LocalDateTime getCreateTime() {
        return createTime;
    }

    public void setCreateTime(LocalDateTime createTime) {
        this.createTime = createTime;
    }
}
