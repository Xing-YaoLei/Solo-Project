package com.training.renewal.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "student_enrollment", indexes = {
    @Index(name = "idx_batch_id", columnList = "batchId"),
    @Index(name = "idx_student_no", columnList = "studentNo"),
    @Index(name = "idx_grade", columnList = "grade"),
    @Index(name = "idx_course_tag", columnList = "courseTag"),
    @Index(name = "idx_consultant_id", columnList = "consultantId")
})
public class StudentEnrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 32)
    private String batchId;

    @Column(nullable = false, length = 32, unique = true)
    private String studentNo;

    @Column(nullable = false, length = 64)
    private String studentName;

    @Column(length = 32)
    private String grade;

    @Column(length = 64)
    private String courseName;

    @Column(length = 32)
    private String courseTag;

    private LocalDate enrollDate;

    private LocalDate expireDate;

    @Column(precision = 10, scale = 2)
    private BigDecimal totalFee;

    @Column(precision = 10, scale = 2)
    private BigDecimal paidFee;

    @Column(length = 32)
    private String consultantId;

    @Column(length = 64)
    private String consultantName;

    @Column(precision = 5, scale = 2)
    private BigDecimal completionRate;

    @Column(length = 16)
    private String renewalStatus;

    @Column(length = 255)
    private String remark;

    @Column(nullable = false)
    private Boolean isDeleted = false;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createTime;

    @UpdateTimestamp
    private LocalDateTime updateTime;

    @Column(length = 64)
    private String dataSource;

    private LocalDateTime sourceSyncTime;
}
