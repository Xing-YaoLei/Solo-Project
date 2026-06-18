package com.testdrive.repository;

import com.testdrive.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByAppointmentDateBetween(LocalDate start, LocalDate end);

    List<Appointment> findByAssignedTo(String assignedTo);

    List<Appointment> findByStatus(String status);

    @Query("SELECT a FROM Appointment a WHERE a.vehicleId = :vehicleId AND a.appointmentDate BETWEEN :start AND :end")
    List<Appointment> findByVehicleIdAndDateRange(@Param("vehicleId") Long vehicleId,
                                                   @Param("start") LocalDate start,
                                                   @Param("end") LocalDate end);

    @Query("SELECT a FROM Appointment a WHERE a.appointmentDate = :date AND a.status = :status")
    List<Appointment> findByDateAndStatus(@Param("date") LocalDate date, @Param("status") String status);
}
