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
@Table(name = "review_material")
public class ReviewMaterial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 256)
    private String title;

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd;

    @Column(name = "total_enrollments")
    private Integer totalEnrollments;

    @Column(name = "renewed_count")
    private Integer renewedCount;

    @Column(name = "lost_count")
    private Integer lostCount;

    @Column(name = "overall_completion_rate", precision = 5, scale = 2)
    private BigDecimal overallCompletionRate;

    @Column(name = "funnel_summary", columnDefinition = "JSON")
    private String funnelSummary;

    @Column(name = "anomaly_summary", columnDefinition = "JSON")
    private String anomalySummary;

    @Column(name = "key_findings", columnDefinition = "TEXT")
    private String keyFindings;

    @Column(name = "action_items", columnDefinition = "TEXT")
    private String actionItems;

    @Enumerated(EnumType.STRING)
    private ReviewStatus status;

    @Column(name = "created_by", length = 64)
    private String createdBy;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum ReviewStatus {
        draft, published
    }
}
