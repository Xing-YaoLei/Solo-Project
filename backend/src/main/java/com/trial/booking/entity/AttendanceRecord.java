package com.trial.booking.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "attendance_record")
public class AttendanceRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long appointmentId;

    @Column(nullable = false, length = 20)
    private String status;

    private LocalDateTime checkInTime;

    @Column(columnDefinition = "TEXT")
    private String remark;

    private Long operatorId;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
