package com.renewal.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "score_feedback")
public class ScoreFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "enrollment_id", nullable = false)
    private Long enrollmentId;

    @Enumerated(EnumType.STRING)
    @Column(name = "score_type", nullable = false)
    private ScoreType scoreType;

    @Column(precision = 5, scale = 2)
    private BigDecimal score;

    @Column(name = "max_score", precision = 5, scale = 2)
    private BigDecimal maxScore;

    @Column(name = "feedback_text", columnDefinition = "TEXT")
    private String feedbackText;

    @Column(name = "recorded_at", nullable = false)
    private LocalDate recordedAt;

    @Enumerated(EnumType.STRING)
    private SourceType source;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public enum ScoreType {
        exam, quiz, homework, overall
    }

    public enum SourceType {
        edu_system, teacher_input, parent_group
    }
}
