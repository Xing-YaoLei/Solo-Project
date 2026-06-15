package com.training.renewal.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

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

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getBatchId() {
        return batchId;
    }

    public void setBatchId(String batchId) {
        this.batchId = batchId;
    }

    public String getBatchType() {
        return batchType;
    }

    public void setBatchType(String batchType) {
        this.batchType = batchType;
    }

    public String getBatchName() {
        return batchName;
    }

    public void setBatchName(String batchName) {
        this.batchName = batchName;
    }

    public LocalDateTime getBatchTime() {
        return batchTime;
    }

    public void setBatchTime(LocalDateTime batchTime) {
        this.batchTime = batchTime;
    }

    public Integer getTotalCount() {
        return totalCount;
    }

    public void setTotalCount(Integer totalCount) {
        this.totalCount = totalCount;
    }

    public Integer getSuccessCount() {
        return successCount;
    }

    public void setSuccessCount(Integer successCount) {
        this.successCount = successCount;
    }

    public Integer getFailCount() {
        return failCount;
    }

    public void setFailCount(Integer failCount) {
        this.failCount = failCount;
    }

    public String getOperatorId() {
        return operatorId;
    }

    public void setOperatorId(String operatorId) {
        this.operatorId = operatorId;
    }

    public String getOperatorName() {
        return operatorName;
    }

    public void setOperatorName(String operatorName) {
        this.operatorName = operatorName;
    }

    public String getRemark() {
        return remark;
    }

    public void setRemark(String remark) {
        this.remark = remark;
    }

    public LocalDateTime getCreateTime() {
        return createTime;
    }

    public void setCreateTime(LocalDateTime createTime) {
        this.createTime = createTime;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getExpectedSyncTime() {
        return expectedSyncTime;
    }

    public void setExpectedSyncTime(LocalDateTime expectedSyncTime) {
        this.expectedSyncTime = expectedSyncTime;
    }

    public LocalDateTime getActualSyncTime() {
        return actualSyncTime;
    }

    public void setActualSyncTime(LocalDateTime actualSyncTime) {
        this.actualSyncTime = actualSyncTime;
    }

    public Boolean getIsDelayed() {
        return isDelayed;
    }

    public void setIsDelayed(Boolean isDelayed) {
        this.isDelayed = isDelayed;
    }
}
