package com.trial.booking.repository;

import com.trial.booking.entity.ChangeLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChangeLogRepository extends JpaRepository<ChangeLog, Long>, JpaSpecificationExecutor<ChangeLog> {

    List<ChangeLog> findByAppointmentIdOrderByCreatedAtDesc(Long appointmentId);

    Page<ChangeLog> findByChangeType(String changeType, Pageable pageable);
}
