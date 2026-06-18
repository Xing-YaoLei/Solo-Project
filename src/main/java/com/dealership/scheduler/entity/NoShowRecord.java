package com.dealership.scheduler.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "no_show_record")
public class NoShowRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", nullable = false, unique = true)
    private TestDriveAppointment appointment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lead_id", nullable = false)
    private CustomerLead lead;

    @Column(nullable = false, length = 30)
    @Enumerated(EnumType.STRING)
    private NoShowStatus status = NoShowStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(columnDefinition = "TEXT")
    private String actionTaken;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "handler_id")
    private SysUser handler;

    private LocalDateTime closeTime;

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

    public NoShowStatus getStatus() {
        return status;
    }

    public void setStatus(NoShowStatus status) {
        this.status = status;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getActionTaken() {
        return actionTaken;
    }

    public void setActionTaken(String actionTaken) {
        this.actionTaken = actionTaken;
    }

    public SysUser getHandler() {
        return handler;
    }

    public void setHandler(SysUser handler) {
        this.handler = handler;
    }

    public LocalDateTime getCloseTime() {
        return closeTime;
    }

    public void setCloseTime(LocalDateTime closeTime) {
        this.closeTime = closeTime;
    }

    public LocalDateTime getCreateTime() {
        return createTime;
    }

    public void setCreateTime(LocalDateTime createTime) {
        this.createTime = createTime;
    }

    public enum NoShowStatus {
        PENDING,
        HANDLING,
        RESCHEDULED,
        CLOSED
    }
}
