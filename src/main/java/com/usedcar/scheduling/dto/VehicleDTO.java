package com.usedcar.scheduling.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class VehicleDTO {

    private Long id;
    private String vin;
    private String brand;
    private String model;
    private Integer year;
    private String color;
    private Long mileage;
    private BigDecimal purchasePrice;
    private BigDecimal listingPrice;
    private String status;
    private String assessorName;
    private String salesName;
    private String storeName;
    private LocalDate purchaseDate;
    private LocalDate listingDate;
    private Integer preparationProgress;
    private Integer missingDocumentCount;
}
