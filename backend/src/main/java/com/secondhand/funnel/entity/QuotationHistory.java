package com.secondhand.funnel.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "quotation_history")
public class QuotationHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "car_id", nullable = false)
    private Long carId;

    @Column(name = "price", nullable = false, precision = 15, scale = 2)
    private BigDecimal price;

    @Column(name = "quoted_by", nullable = false)
    private Long quotedBy;

    @CreationTimestamp
    @Column(name = "quoted_at", nullable = false, updatable = false)
    private LocalDateTime quotedAt;

    @Column(name = "valid_days", nullable = false)
    private Integer validDays = 7;
}
