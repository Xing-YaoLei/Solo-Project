package com.dealership.scheduler.repository;

import com.dealership.scheduler.entity.NoShowRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface NoShowRecordRepository extends JpaRepository<NoShowRecord, Long> {
    Optional<NoShowRecord> findByAppointmentId(Long appointmentId);
    List<NoShowRecord> findByStatus(NoShowRecord.NoShowStatus status);
    List<NoShowRecord> findByLeadId(Long leadId);

    @Query("SELECT n FROM NoShowRecord n JOIN n.appointment a WHERE a.appointmentDate BETWEEN :start AND :end")
    List<NoShowRecord> findByDateRange(@Param("start") LocalDate start, @Param("end") LocalDate end);
}
