package com.training.renewal.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "progress_comment", indexes = {
    @Index(name = "idx_student_no", columnList = "studentNo"),
    @Index(name = "idx_consultant_id", columnList = "consultantId"),
    @Index(name = "idx_create_time", columnList = "createTime")
})
public class ProgressComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 32)
    private String studentNo;

    @Column(length = 64)
    private String studentName;

    @Column(length = 32)
    private String consultantId;

    @Column(length = 64)
    private String consultantName;

    @Column(length = 32)
    private String commentType;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(length = 16)
    private String riskLevel;

    @Column(length = 64)
    private String followUpPlan;

    private LocalDateTime followUpTime;

    @Column(length = 16)
    private String status;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createTime;

    @UpdateTimestamp
    private LocalDateTime updateTime;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getStudentNo() { return studentNo; }
    public void setStudentNo(String studentNo) { this.studentNo = studentNo; }

    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }

    public String getConsultantId() { return consultantId; }
    public void setConsultantId(String consultantId) { this.consultantId = consultantId; }

    public String getConsultantName() { return consultantName; }
    public void setConsultantName(String consultantName) { this.consultantName = consultantName; }

    public String getCommentType() { return commentType; }
    public void setCommentType(String commentType) { this.commentType = commentType; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }

    public String getFollowUpPlan() { return followUpPlan; }
    public void setFollowUpPlan(String followUpPlan) { this.followUpPlan = followUpPlan; }

    public LocalDateTime getFollowUpTime() { return followUpTime; }
    public void setFollowUpTime(LocalDateTime followUpTime) { this.followUpTime = followUpTime; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreateTime() { return createTime; }
    public void setCreateTime(LocalDateTime createTime) { this.createTime = createTime; }

    public LocalDateTime getUpdateTime() { return updateTime; }
    public void setUpdateTime(LocalDateTime updateTime) { this.updateTime = updateTime; }
}
