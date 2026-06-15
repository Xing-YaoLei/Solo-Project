package com.trial.booking.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "appointment", indexes = {
        @Index(name = "idx_trial_date", columnList = "trialDate"),
        @Index(name = "idx_teacher_time", columnList = "teacherId, trialDate, timeSlot"),
        @Index(name = "idx_status", columnList = "status")
})
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String studentName;

    @Column(length = 20)
    private String studentPhone;

    @Column(nullable = false, length = 20)
    private String subject;

    @Column(nullable = false)
    private LocalDate trialDate;

    @Column(nullable = false, length = 20)
    private String timeSlot;

    @Column(nullable = false)
    private Long teacherId;

    @Transient
    private String teacherName;

    @Column(nullable = false, length = 50)
    private String campus;

    @Column(nullable = false, length = 20)
    private String status = "PENDING";

    @Column(length = 20)
    private String attendanceStatus;

    private LocalDateTime checkInTime;

    @Column(columnDefinition = "TEXT")
    private String remark;

    private Long parentId;

    private Long studentUserId;

    private Long sourceOriginalId;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    private Long createdBy;

    private Long updatedBy;
}
