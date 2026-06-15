package com.trial.booking.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "change_log", indexes = {
        @Index(name = "idx_appointment", columnList = "appointmentId"),
        @Index(name = "idx_change_type", columnList = "changeType")
})
public class ChangeLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long appointmentId;

    @Column(nullable = false, length = 30)
    private String changeType;

    @Column(length = 50)
    private String fieldName;

    @Column(columnDefinition = "TEXT")
    private String oldValue;

    @Column(columnDefinition = "TEXT")
    private String newValue;

    @Column(length = 255)
    private String description;

    @Column(columnDefinition = "TEXT")
    private String reason;

    private Long sourceId;

    private Long newAppointmentId;

    @Column(length = 100)
    private String oldStudentName;
    @Column(length = 20)
    private String oldSubject;
    @Column(length = 20)
    private String oldTrialDate;
    @Column(length = 20)
    private String oldTimeSlot;
    @Column(length = 50)
    private String oldTeacherName;

    @Column(length = 100)
    private String newStudentName;
    @Column(length = 20)
    private String newSubject;
    @Column(length = 20)
    private String newTrialDate;
    @Column(length = 20)
    private String newTimeSlot;
    @Column(length = 50)
    private String newTeacherName;

    private Long sourceOriginalId;

    @Column(length = 50)
    private String operatorName;

    private Long operatorId;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
