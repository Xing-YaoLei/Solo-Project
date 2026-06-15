package com.training.renewal.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "academic_record", indexes = {
    @Index(name = "idx_student_no", columnList = "studentNo"),
    @Index(name = "idx_batch_id", columnList = "batchId"),
    @Index(name = "idx_exam_date", columnList = "examDate")
})
public class AcademicRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 32)
    private String batchId;

    @Column(nullable = false, length = 32)
    private String studentNo;

    @Column(length = 64)
    private String courseName;

    @Column(length = 32)
    private String courseTag;

    private LocalDate examDate;

    @Column(length = 64)
    private String examName;

    @Column(precision = 5, scale = 2)
    private BigDecimal score;

    @Column(precision = 5, scale = 2)
    private BigDecimal classRank;

    @Column(precision = 5, scale = 2)
    private BigDecimal gradeRank;

    @Column(precision = 5, scale = 2)
    private BigDecimal progressRate;

    @Column(length = 255)
    private String teacherComment;

    @Column(length = 16)
    private String level;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createTime;

    @Column(length = 64)
    private String dataSource;
}
