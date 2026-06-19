package com.usedcar.scheduling.domain;

import com.usedcar.scheduling.enums.QuotationType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "t_quotation_history")
@EntityListeners(AuditingEntityListener.class)
public class QuotationHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @Column(nullable = false)
    private BigDecimal quotationPrice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private QuotationType quotationType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "operator_id")
    private User operator;

    private String customerName;

    private String remark;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
