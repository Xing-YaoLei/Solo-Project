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

    @Query("SELECT n FROM NoShowRecord n LEFT JOIN FETCH n.appointment LEFT JOIN FETCH n.lead LEFT JOIN FETCH n.handler WHERE n.id = :id")
    Optional<NoShowRecord> findByIdWithDetails(@Param("id") Long id);

    @Query("SELECT DISTINCT n FROM NoShowRecord n LEFT JOIN FETCH n.appointment LEFT JOIN FETCH n.lead LEFT JOIN FETCH n.handler ORDER BY n.createTime DESC")
    List<NoShowRecord> findAllWithDetails();

    @Query("SELECT DISTINCT n FROM NoShowRecord n LEFT JOIN FETCH n.appointment LEFT JOIN FETCH n.lead LEFT JOIN FETCH n.handler WHERE n.status = :status ORDER BY n.createTime DESC")
    List<NoShowRecord> findByStatusWithDetails(@Param("status") NoShowRecord.NoShowStatus status);

    Optional<NoShowRecord> findByAppointmentId(Long appointmentId);
    List<NoShowRecord> findByStatus(NoShowRecord.NoShowStatus status);
    List<NoShowRecord> findByLeadId(Long leadId);

    @Query("SELECT n FROM NoShowRecord n JOIN n.appointment a WHERE a.appointmentDate BETWEEN :start AND :end")
    List<NoShowRecord> findByDateRange(@Param("start") LocalDate start, @Param("end") LocalDate end);
}
