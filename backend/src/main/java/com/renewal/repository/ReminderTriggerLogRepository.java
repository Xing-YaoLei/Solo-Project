package com.renewal.repository;

import com.renewal.entity.ReminderTriggerLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ReminderTriggerLogRepository extends JpaRepository<ReminderTriggerLog, Long> {

    List<ReminderTriggerLog> findByEnrollmentIdOrderByTriggeredAtDesc(Long enrollmentId);

    List<ReminderTriggerLog> findByIsAnomalyTrueOrderByTriggeredAtDesc();

    @Query("SELECT l FROM ReminderTriggerLog l WHERE l.triggeredAt BETWEEN :start AND :end ORDER BY l.triggeredAt DESC")
    List<ReminderTriggerLog> findByTriggeredAtBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT l FROM ReminderTriggerLog l WHERE l.isAnomaly = true AND l.triggeredAt BETWEEN :start AND :end ORDER BY l.triggeredAt DESC")
    List<ReminderTriggerLog> findAnomaliesBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
