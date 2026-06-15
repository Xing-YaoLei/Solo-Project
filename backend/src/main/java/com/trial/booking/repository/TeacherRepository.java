package com.trial.booking.repository;

import com.trial.booking.entity.Teacher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TeacherRepository extends JpaRepository<Teacher, Long> {

    List<Teacher> findByEnabledTrue();

    List<Teacher> findBySubjectAndEnabledTrue(String subject);

    Optional<Teacher> findByUserId(Long userId);
}
