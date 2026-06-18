package com.testdrive.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "test_drive_feedback")
public class TestDriveFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long appointmentId;

    @Column(nullable = false)
    private Long vehicleId;

    @Column(length = 20)
    private String satisfaction;

    @Column(length = 500)
    private String customerOpinion;

    @Column(length = 20)
    private String purchaseIntention;

    @Column(length = 500)
    private String internalNote;

    @Column(length = 50)
    private String filledBy;

    private LocalDateTime filledAt;

    @Column(length = 50)
    private String updatedBy;

    private LocalDateTime updatedAt;

    @Column(nullable = false)
    private Integer version;
}
