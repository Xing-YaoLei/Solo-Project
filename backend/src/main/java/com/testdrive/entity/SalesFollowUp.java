package com.testdrive.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "sales_follow_up")
public class SalesFollowUp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long vehicleId;

    @Column(nullable = false)
    private Long appointmentId;

    @Column(nullable = false, length = 50)
    private String customerName;

    @Column(length = 20)
    private String customerPhone;

    @Column(length = 20)
    private String leadSource;

    @Column(length = 20)
    private String leadStatus;

    @Column(nullable = false, length = 50)
    private String salesPerson;

    private LocalDateTime lastContactTime;

    @Column(length = 500)
    private String followUpNote;

    private LocalDateTime nextFollowUpTime;
}
