package com.testdrive.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class AppointmentDispatchVO {
    private Long appointmentId;
    private Long vehicleId;
    private String vin;
    private String brand;
    private String model;
    private String year;
    private String color;
    private BigDecimal price;
    private String vehicleStatus;
    private Integer mileage;
    private String customerName;
    private String customerPhone;
    private String leadSource;
    private String leadStatus;
    private String salesPerson;
    private String followUpNote;
    private String appointmentDate;
    private String startTime;
    private String endTime;
    private String appointmentStatus;
    private String assignedTo;
    private Long feedbackId;
    private String satisfaction;
    private String purchaseIntention;
}
