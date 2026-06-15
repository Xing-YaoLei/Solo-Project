package com.renewal.repository;

import com.renewal.entity.Enrollment;
import com.renewal.entity.Enrollment.EnrollmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {

    List<Enrollment> findByStudentId(Long studentId);

    List<Enrollment> findByCourseId(Long courseId);

    List<Enrollment> findByStatus(EnrollmentStatus status);

    @Query("SELECT e FROM Enrollment e WHERE e.status = :status AND e.expireDate <= CURRENT_DATE")
    List<Enrollment> findExpiredByStatus(@Param("status") EnrollmentStatus status);

    long countByStatus(EnrollmentStatus status);
}
