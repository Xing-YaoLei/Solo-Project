package com.testdrive.repository;

import com.testdrive.entity.NoShowLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NoShowLogRepository extends JpaRepository<NoShowLog, Long> {
    List<NoShowLog> findByAppointmentId(Long appointmentId);
    List<NoShowLog> findByResponsiblePerson(String responsiblePerson);
    List<NoShowLog> findByStatus(String status);
    List<NoShowLog> findAllByOrderByCreatedAtDesc();
}
