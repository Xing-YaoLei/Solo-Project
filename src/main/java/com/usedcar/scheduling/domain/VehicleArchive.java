package com.usedcar.scheduling.domain;

import com.usedcar.scheduling.enums.ArchiveType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "t_vehicle_archive")
@EntityListeners(AuditingEntityListener.class)
public class VehicleArchive {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ArchiveType archiveType;

    private String oldValue;

    private String newValue;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "operator_id")
    private User operator;

    private String remark;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
