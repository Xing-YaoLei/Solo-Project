package com.trial.booking.repository;

import com.trial.booking.entity.Appointment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long>, JpaSpecificationExecutor<Appointment> {

    List<Appointment> findByTeacherIdAndTrialDateAndTimeSlotAndStatusNot(
            Long teacherId, LocalDate trialDate, String timeSlot, String status);

    @Query("SELECT a FROM Appointment a WHERE " +
            "a.teacherId = :teacherId AND a.trialDate = :trialDate AND a.timeSlot = :timeSlot " +
            "AND a.status NOT IN ('CANCELLED', 'RESCHEDULED') " +
            "AND (:excludeId IS NULL OR a.id != :excludeId)")
    List<Appointment> findConflictingAppointments(
            @Param("teacherId") Long teacherId,
            @Param("trialDate") LocalDate trialDate,
            @Param("timeSlot") String timeSlot,
            @Param("excludeId") Long excludeId);

    Page<Appointment> findByTrialDateBetween(LocalDate startDate, LocalDate endDate, Pageable pageable);

    List<Appointment> findByIdIn(List<Long> ids);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.status = 'CONFIRMED' " +
            "AND a.trialDate BETWEEN :startDate AND :endDate " +
            "AND (:campus IS NULL OR a.campus = :campus)")
    long countConfirmedByDateRange(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("campus") String campus);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.attendanceStatus = :status " +
            "AND a.trialDate BETWEEN :startDate AND :endDate " +
            "AND (:campus IS NULL OR a.campus = :campus)")
    long countByAttendanceStatusAndDateRange(
            @Param("status") String status,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("campus") String campus);
}
