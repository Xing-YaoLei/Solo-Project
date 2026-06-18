package com.dealership.scheduler.dto;

import com.dealership.scheduler.entity.TestDriveAppointment;

import java.time.LocalDate;

public class AppointmentQueryDTO {
    private LocalDate startDate;
    private LocalDate endDate;
    private String customerName;
    private String customerPhone;
    private TestDriveAppointment.AppointmentStatus status;
    private Long salesId;
    private String vehicleId;

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public void setCustomerPhone(String customerPhone) {
        this.customerPhone = customerPhone;
    }

    public TestDriveAppointment.AppointmentStatus getStatus() {
        return status;
    }

    public void setStatus(TestDriveAppointment.AppointmentStatus status) {
        this.status = status;
    }

    public Long getSalesId() {
        return salesId;
    }

    public void setSalesId(Long salesId) {
        this.salesId = salesId;
    }

    public String getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(String vehicleId) {
        this.vehicleId = vehicleId;
    }
}
