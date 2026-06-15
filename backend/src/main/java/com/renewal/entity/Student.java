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
@Table(name = "student")
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_name", nullable = false, length = 64)
    private String studentName;

    @Column(length = 20)
    private String phone;

    @Column(name = "parent_name", length = 64)
    private String parentName;

    @Column(name = "parent_phone", length = 20)
    private String parentPhone;

    @Column(length = 20)
    private String grade;

    @Column(length = 128)
    private String school;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SourceType source;

    @Column(name = "source_id", length = 64)
    private String sourceId;

    @Enumerated(EnumType.STRING)
    private StudentStatus status;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum SourceType {
        edu_system, registration, parent_group
    }

    public enum StudentStatus {
        active, graduated, withdrawn
    }
}
