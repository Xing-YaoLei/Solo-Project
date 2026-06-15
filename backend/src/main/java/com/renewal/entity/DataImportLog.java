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
@Table(name = "data_import_log")
public class DataImportLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SourceType source;

    @Column(name = "batch_id", nullable = false, length = 64)
    private String batchId;

    @Column(name = "raw_count")
    private Integer rawCount;

    @Column(name = "cleaned_count")
    private Integer cleanedCount;

    @Column(name = "duplicate_count")
    private Integer duplicateCount;

    @Column(name = "mismatch_count")
    private Integer mismatchCount;

    @Enumerated(EnumType.STRING)
    private ImportStatus status;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(length = 64)
    private String operator;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum SourceType {
        edu_system, registration, parent_group
    }

    public enum ImportStatus {
        pending, processing, completed, failed
    }
}
