package com.secondhand.funnel.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentMissingDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long carId;
    private String carVin;
    private String brand;
    private String model;
    private Long missingCount;
    private String missingDocs;
}
