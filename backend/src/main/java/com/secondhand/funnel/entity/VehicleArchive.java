package com.secondhand.funnel.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "vehicle_archive")
public class VehicleArchive {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "car_id", nullable = false, unique = true)
    private Long carId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "archive_data", columnDefinition = "json")
    private Map<String, Object> archiveData;

    @Column(name = "is_complete", nullable = false)
    private Boolean isComplete = false;

    @UpdateTimestamp
    @Column(name = "saved_at", nullable = false)
    private LocalDateTime savedAt;
}
