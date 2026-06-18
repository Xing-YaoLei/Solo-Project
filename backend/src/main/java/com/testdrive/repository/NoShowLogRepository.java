package com.testdrive.repository;

import com.testdrive.entity.NoShowLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface NoShowLogRepository extends JpaRepository<NoShowLog, Long> {
    Optional<NoShowLog> findByAppointmentId(Long appointmentId);
    List<NoShowLog> findByResponsiblePerson(String responsiblePerson);
    List<NoShowLog> findByStatus(String status);
}
