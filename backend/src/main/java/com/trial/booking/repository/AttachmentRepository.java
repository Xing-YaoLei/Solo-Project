package com.trial.booking.repository;

import com.trial.booking.entity.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttachmentRepository extends JpaRepository<Attachment, Long> {

    List<Attachment> findByAppointmentIdOrderByCreatedAtDesc(Long appointmentId);
}
