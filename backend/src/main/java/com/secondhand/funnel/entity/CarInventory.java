package com.secondhand.funnel.entity;

import com.secondhand.funnel.enums.CarStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "car_inventory")
public class CarInventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "car_vin", nullable = false, unique = true, length = 50)
    private String carVin;

    @Column(name = "plate_number", length = 20)
    private String plateNumber;

    @Column(name = "brand", nullable = false, length = 50)
    private String brand;

    @Column(name = "model", nullable = false, length = 100)
    private String model;

    @Column(name = "mileage", precision = 12, scale = 2)
    private BigDecimal mileage;

    @Column(name = "register_date")
    private LocalDate registerDate;

    @Column(name = "assessor_id")
    private Long assessorId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private CarStatus status = CarStatus.PENDING_LISTING;

    @Column(name = "source_library_delay", nullable = false)
    private Boolean sourceLibraryDelay = false;

    @Column(name = "detector_missing", nullable = false)
    private Boolean detectorMissing = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
