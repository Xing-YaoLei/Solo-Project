package com.secondhand.funnel.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "finance_approval_config")
public class FinanceApprovalConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "effective_date", nullable = false)
    private LocalDate effectiveDate;

    @Column(name = "approval_rate_min", nullable = false, precision = 5, scale = 4)
    private BigDecimal approvalRateMin;

    @Column(name = "approval_rate_max", nullable = false, precision = 5, scale = 4)
    private BigDecimal approvalRateMax;

    @Column(name = "remark", length = 500)
    private String remark;

    @Column(name = "changed", nullable = false)
    private Boolean changed = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
