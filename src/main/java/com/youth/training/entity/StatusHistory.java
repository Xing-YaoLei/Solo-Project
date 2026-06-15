package com.youth.training.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "status_history")
public class StatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long businessId;

    @Column(nullable = false, length = 50)
    private String businessType;

    @Column(nullable = false, length = 50)
    private String oldStatus;

    @Column(nullable = false, length = 50)
    private String newStatus;

    @Column(length = 500)
    private String changeReason;

    @Column(length = 100)
    private String operator;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createTime;
}
