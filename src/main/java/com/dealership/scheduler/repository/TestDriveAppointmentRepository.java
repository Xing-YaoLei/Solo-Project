package com.dealership.scheduler.repository;

import com.dealership.scheduler.entity.TestDriveAppointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TestDriveAppointmentRepository extends JpaRepository<TestDriveAppointment, Long>, JpaSpecificationExecutor<TestDriveAppointment> {

    @Query("SELECT a FROM TestDriveAppointment a LEFT JOIN FETCH a.lead LEFT JOIN FETCH a.salesConsultant WHERE a.appointmentDate = :date")
    List<TestDriveAppointment> findByAppointmentDateWithDetails(@Param("date") LocalDate date);

    @Query("SELECT a FROM TestDriveAppointment a LEFT JOIN FETCH a.lead LEFT JOIN FETCH a.salesConsultant WHERE a.id = :id")
    Optional<TestDriveAppointment> findByIdWithDetails(@Param("id") Long id);

    @Query("SELECT DISTINCT a FROM TestDriveAppointment a LEFT JOIN FETCH a.lead LEFT JOIN FETCH a.salesConsultant WHERE a.appointmentDate BETWEEN :startDate AND :endDate")
    List<TestDriveAppointment> findByDateRangeWithDetails(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    List<TestDriveAppointment> findByAppointmentDate(LocalDate date);
    List<TestDriveAppointment> findByLeadId(Long leadId);
    List<TestDriveAppointment> findBySalesConsultantId(Long salesId);
    List<TestDriveAppointment> findByStatus(TestDriveAppointment.AppointmentStatus status);

    @Query("SELECT a FROM TestDriveAppointment a WHERE a.appointmentDate BETWEEN :startDate AND :endDate")
    List<TestDriveAppointment> findByDateRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT a FROM TestDriveAppointment a WHERE a.appointmentDate = :date AND a.status = :status")
    List<TestDriveAppointment> findByDateAndStatus(@Param("date") LocalDate date, @Param("status") TestDriveAppointment.AppointmentStatus status);

    @Query("SELECT a FROM TestDriveAppointment a WHERE a.status = :status AND a.appointmentDate < :date")
    List<TestDriveAppointment> findByStatusAndDateBefore(@Param("status") TestDriveAppointment.AppointmentStatus status, @Param("date") LocalDate date);

    @Query("SELECT a FROM TestDriveAppointment a WHERE a.appointmentDate = :date AND a.vehicleId = :vehicleId")
    List<TestDriveAppointment> findByDateAndVehicleId(@Param("date") LocalDate date, @Param("vehicleId") String vehicleId);
}
