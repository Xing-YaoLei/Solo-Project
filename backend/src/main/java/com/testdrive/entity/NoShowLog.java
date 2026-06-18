package com.testdrive.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "no_show_log")
public class NoShowLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long appointmentId;

    @Column(nullable = false, length = 50)
    private String responsiblePerson;

    @Column(length = 500)
    private String reason;

    @Column(length = 500)
    private String handleAction;

    @Column(length = 20)
    private String status;

    private LocalDateTime closedAt;

    @Column(length = 50)
    private String closedBy;

    private LocalDateTime createdAt;
}
