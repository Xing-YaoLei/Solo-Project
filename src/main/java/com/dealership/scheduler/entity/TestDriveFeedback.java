package com.dealership.scheduler.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "test_drive_feedback")
public class TestDriveFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", nullable = false, unique = true)
    private TestDriveAppointment appointment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lead_id", nullable = false)
    private CustomerLead lead;

    @Column(nullable = false)
    private Integer overallRating;

    @Column(nullable = false)
    private Integer vehicleComfortRating;

    @Column(nullable = false)
    private Integer vehiclePerformanceRating;

    @Column(nullable = false)
    private Integer salesServiceRating;

    @Column(columnDefinition = "TEXT")
    private String likes;

    @Column(columnDefinition = "TEXT")
    private String dislikes;

    @Column(length = 30)
    @Enumerated(EnumType.STRING)
    private PurchaseIntent purchaseIntent;

    @Column(columnDefinition = "TEXT")
    private String customerComment;

    @Column(columnDefinition = "TEXT")
    private String salesComment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sales_id")
    private SysUser salesConsultant;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createTime;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public TestDriveAppointment getAppointment() {
        return appointment;
    }

    public void setAppointment(TestDriveAppointment appointment) {
        this.appointment = appointment;
    }

    public CustomerLead getLead() {
        return lead;
    }

    public void setLead(CustomerLead lead) {
        this.lead = lead;
    }

    public Integer getOverallRating() {
        return overallRating;
    }

    public void setOverallRating(Integer overallRating) {
        this.overallRating = overallRating;
    }

    public Integer getVehicleComfortRating() {
        return vehicleComfortRating;
    }

    public void setVehicleComfortRating(Integer vehicleComfortRating) {
        this.vehicleComfortRating = vehicleComfortRating;
    }

    public Integer getVehiclePerformanceRating() {
        return vehiclePerformanceRating;
    }

    public void setVehiclePerformanceRating(Integer vehiclePerformanceRating) {
        this.vehiclePerformanceRating = vehiclePerformanceRating;
    }

    public Integer getSalesServiceRating() {
        return salesServiceRating;
    }

    public void setSalesServiceRating(Integer salesServiceRating) {
        this.salesServiceRating = salesServiceRating;
    }

    public String getLikes() {
        return likes;
    }

    public void setLikes(String likes) {
        this.likes = likes;
    }

    public String getDislikes() {
        return dislikes;
    }

    public void setDislikes(String dislikes) {
        this.dislikes = dislikes;
    }

    public PurchaseIntent getPurchaseIntent() {
        return purchaseIntent;
    }

    public void setPurchaseIntent(PurchaseIntent purchaseIntent) {
        this.purchaseIntent = purchaseIntent;
    }

    public String getCustomerComment() {
        return customerComment;
    }

    public void setCustomerComment(String customerComment) {
        this.customerComment = customerComment;
    }

    public String getSalesComment() {
        return salesComment;
    }

    public void setSalesComment(String salesComment) {
        this.salesComment = salesComment;
    }

    public SysUser getSalesConsultant() {
        return salesConsultant;
    }

    public void setSalesConsultant(SysUser salesConsultant) {
        this.salesConsultant = salesConsultant;
    }

    public LocalDateTime getCreateTime() {
        return createTime;
    }

    public void setCreateTime(LocalDateTime createTime) {
        this.createTime = createTime;
    }

    public enum PurchaseIntent {
        VERY_HIGH,
        HIGH,
        MEDIUM,
        LOW,
        NONE
    }
}
