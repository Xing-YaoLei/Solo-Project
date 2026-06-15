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

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "renewal_funnel_stage")
public class RenewalFunnelStage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "enrollment_id", nullable = false)
    private Long enrollmentId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FunnelStage stage;

    @Column(name = "stage_entered_at", nullable = false)
    private LocalDateTime stageEnteredAt;

    @Column(name = "stage_exited_at")
    private LocalDateTime stageExitedAt;

    @Column(length = 64)
    private String operator;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public enum FunnelStage {
        in_course, near_expire, reminded, negotiating, renewed, lost
    }
}
