package com.training.renewal.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
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
}
