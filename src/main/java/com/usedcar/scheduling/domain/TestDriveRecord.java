package com.usedcar.scheduling.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "t_test_drive_record")
@EntityListeners(AuditingEntityListener.class)
public class TestDriveRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @Column(nullable = false)
    private String customerName;

    @Column(nullable = false)
    private String customerPhone;

    @Column(nullable = false)
    private LocalDate driveDate;

    private Long mileageBefore;

    private Long mileageAfter;

    private String feedback;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sales_id")
    private User sales;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
