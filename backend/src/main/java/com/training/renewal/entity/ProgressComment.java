package com.training.renewal.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
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
}
