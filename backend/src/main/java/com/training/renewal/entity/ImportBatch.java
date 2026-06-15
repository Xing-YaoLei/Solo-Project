package com.training.renewal.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "import_batch", indexes = {
    @Index(name = "idx_batch_type", columnList = "batchType"),
    @Index(name = "idx_batch_time", columnList = "batchTime")
})
public class ImportBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 32, unique = true)
    private String batchId;

    @Column(nullable = false, length = 32)
    private String batchType;

    @Column(nullable = false, length = 128)
    private String batchName;

    @Column(nullable = false)
    private LocalDateTime batchTime;

    private Integer totalCount;

    private Integer successCount;

    private Integer failCount;

    @Column(length = 32)
    private String operatorId;

    @Column(length = 64)
    private String operatorName;

    @Column(length = 512)
    private String remark;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createTime;

    @Column(length = 16)
    private String status;

    private LocalDateTime expectedSyncTime;

    private LocalDateTime actualSyncTime;

    private Boolean isDelayed = false;
}
