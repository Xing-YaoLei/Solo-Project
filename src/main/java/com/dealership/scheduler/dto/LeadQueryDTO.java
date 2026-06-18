package com.dealership.scheduler.dto;

import com.dealership.scheduler.entity.CustomerLead;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class LeadQueryDTO {
    private String customerName;
    private String phone;
    private CustomerLead.LeadStatus status;
    private CustomerLead.LeadSource source;
    private Long ownerId;
    private LocalDate startDate;
    private LocalDate endDate;

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public CustomerLead.LeadStatus getStatus() {
        return status;
    }

    public void setStatus(CustomerLead.LeadStatus status) {
        this.status = status;
    }

    public CustomerLead.LeadSource getSource() {
        return source;
    }

    public void setSource(CustomerLead.LeadSource source) {
        this.source = source;
    }

    public Long getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(Long ownerId) {
        this.ownerId = ownerId;
    }

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
}
