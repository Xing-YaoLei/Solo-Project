package com.usedcar.scheduling.domain;

import com.usedcar.scheduling.enums.VehicleStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "t_vehicle")
public class Vehicle extends BaseEntity {

    @Column(unique = true, nullable = false)
    private String vin;

    @Column(nullable = false)
    private String brand;

    @Column(nullable = false)
    private String model;

    private Integer year;

    private String color;

    private Long mileage;

    private BigDecimal purchasePrice;

    private BigDecimal listingPrice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VehicleStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessor_id")
    private User assessor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sales_id")
    private User sales;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id")
    private Store store;

    private LocalDate purchaseDate;

    private LocalDate listingDate;
}
