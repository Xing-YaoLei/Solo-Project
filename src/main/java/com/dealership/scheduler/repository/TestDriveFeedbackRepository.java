package com.dealership.scheduler.repository;

import com.dealership.scheduler.entity.TestDriveFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TestDriveFeedbackRepository extends JpaRepository<TestDriveFeedback, Long> {

    @Query("SELECT f FROM TestDriveFeedback f LEFT JOIN FETCH f.salesConsultant LEFT JOIN FETCH f.lead WHERE f.appointment.id = :appointmentId")
    Optional<TestDriveFeedback> findByAppointmentIdWithDetails(@Param("appointmentId") Long appointmentId);

    @Query("SELECT f FROM TestDriveFeedback f LEFT JOIN FETCH f.salesConsultant LEFT JOIN FETCH f.appointment WHERE f.lead.id = :leadId")
    List<TestDriveFeedback> findByLeadIdWithDetails(@Param("leadId") Long leadId);

    Optional<TestDriveFeedback> findByAppointmentId(Long appointmentId);
    List<TestDriveFeedback> findByLeadId(Long leadId);
    List<TestDriveFeedback> findBySalesConsultantId(Long salesId);
}
