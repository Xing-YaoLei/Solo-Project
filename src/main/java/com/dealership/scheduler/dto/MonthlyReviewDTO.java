package com.dealership.scheduler.dto;

import java.time.LocalDate;
import java.util.Map;

public class MonthlyReviewDTO {
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer totalLeads;
    private Integer convertedLeads;
    private Double conversionRate;
    private Integer totalAppointments;
    private Integer completedTestDrives;
    private Integer noShows;
    private Map<String, Integer> statusDistribution;
    private Map<String, String> salesPerformance;
    private String filterConditions;
    private java.time.LocalDateTime generatedAt;
    private String operatorName;

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

    public Integer getTotalLeads() {
        return totalLeads;
    }

    public void setTotalLeads(Integer totalLeads) {
        this.totalLeads = totalLeads;
    }

    public Integer getConvertedLeads() {
        return convertedLeads;
    }

    public void setConvertedLeads(Integer convertedLeads) {
        this.convertedLeads = convertedLeads;
    }

    public Double getConversionRate() {
        return conversionRate;
    }

    public void setConversionRate(Double conversionRate) {
        this.conversionRate = conversionRate;
    }

    public Integer getTotalAppointments() {
        return totalAppointments;
    }

    public void setTotalAppointments(Integer totalAppointments) {
        this.totalAppointments = totalAppointments;
    }

    public Integer getCompletedTestDrives() {
        return completedTestDrives;
    }

    public void setCompletedTestDrives(Integer completedTestDrives) {
        this.completedTestDrives = completedTestDrives;
    }

    public Integer getNoShows() {
        return noShows;
    }

    public void setNoShows(Integer noShows) {
        this.noShows = noShows;
    }

    public Map<String, Integer> getStatusDistribution() {
        return statusDistribution;
    }

    public void setStatusDistribution(Map<String, Integer> statusDistribution) {
        this.statusDistribution = statusDistribution;
    }

    public Map<String, String> getSalesPerformance() {
        return salesPerformance;
    }

    public void setSalesPerformance(Map<String, String> salesPerformance) {
        this.salesPerformance = salesPerformance;
    }

    public String getFilterConditions() {
        return filterConditions;
    }

    public void setFilterConditions(String filterConditions) {
        this.filterConditions = filterConditions;
    }

    public java.time.LocalDateTime getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(java.time.LocalDateTime generatedAt) {
        this.generatedAt = generatedAt;
    }

    public String getOperatorName() {
        return operatorName;
    }

    public void setOperatorName(String operatorName) {
        this.operatorName = operatorName;
    }
}
