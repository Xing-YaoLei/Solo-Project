package com.renewal.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "threshold_config")
public class ThresholdConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "config_key", nullable = false, unique = true, length = 128)
    private String configKey;

    @Column(name = "config_name", nullable = false, length = 128)
    private String configName;

    @Column(name = "config_value", nullable = false, precision = 10, scale = 2)
    private BigDecimal configValue;

    @Column(name = "config_unit", length = 32)
    private String configUnit;

    @Column(name = "config_group", nullable = false, length = 64)
    private String configGroup;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "updated_by", length = 64)
    private String updatedBy;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
