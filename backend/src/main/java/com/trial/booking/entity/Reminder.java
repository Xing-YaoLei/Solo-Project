package com.trial.booking.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "reminder")
public class Reminder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long appointmentId;

    @Column(length = 50)
    private String studentName;

    @Column(length = 20)
    private String studentPhone;

    @Column(length = 20)
    private String subject;

    @Column(length = 20)
    private String type = "SMS";

    @Column(nullable = false, length = 20)
    private String status = "PENDING";

    private LocalDateTime sentAt;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(columnDefinition = "TEXT")
    private String failReason;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @Transient
    private LocalDate trialDate;

    @Transient
    private String timeSlot;

    @Transient
    private String teacherName;
}
