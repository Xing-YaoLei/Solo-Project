package com.training.renewal.repository;

import com.training.renewal.entity.StudentEnrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface StudentEnrollmentRepository extends JpaRepository<StudentEnrollment, Long>,
        JpaSpecificationExecutor<StudentEnrollment> {

    Optional<StudentEnrollment> findByStudentNo(String studentNo);

    List<StudentEnrollment> findByBatchId(String batchId);

    List<StudentEnrollment> findByConsultantId(String consultantId);

    List<StudentEnrollment> findByCourseTag(String courseTag);

    List<StudentEnrollment> findByGrade(String grade);

    @Query("SELECT s.courseTag, COUNT(s) FROM StudentEnrollment s WHERE s.isDeleted = false GROUP BY s.courseTag")
    List<Object[]> countByCourseTag();

    @Query("SELECT s.renewalStatus, COUNT(s) FROM StudentEnrollment s WHERE s.isDeleted = false GROUP BY s.renewalStatus")
    List<Object[]> countByRenewalStatus();

    @Query("SELECT s.grade, COUNT(s) FROM StudentEnrollment s WHERE s.isDeleted = false GROUP BY s.grade")
    List<Object[]> countByGrade();

    @Query("SELECT s.consultantId, s.consultantName, COUNT(s), AVG(s.completionRate) " +
           "FROM StudentEnrollment s WHERE s.isDeleted = false " +
           "GROUP BY s.consultantId, s.consultantName")
    List<Object[]> getConsultantStats();

    @Query("SELECT s FROM StudentEnrollment s WHERE s.isDeleted = false " +
           "AND s.expireDate BETWEEN :startDate AND :endDate ORDER BY s.expireDate ASC")
    List<StudentEnrollment> findExpiringStudents(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT COUNT(s) FROM StudentEnrollment s WHERE s.isDeleted = false " +
           "AND s.completionRate < :rate")
    long countByCompletionRateLessThan(@Param("rate") java.math.BigDecimal rate);

    @Query("SELECT s FROM StudentEnrollment s WHERE s.isDeleted = false " +
           "AND s.consultantId = :consultantId ORDER BY s.completionRate ASC")
    List<StudentEnrollment> findByConsultantIdOrderByCompletionRateAsc(
            @Param("consultantId") String consultantId);

    @Query(value = "SELECT * FROM student_enrollment WHERE is_deleted = false " +
                   "ORDER BY completion_rate ASC LIMIT :limit", nativeQuery = true)
    List<StudentEnrollment> findTopByCompletionRateAsc(@Param("limit") int limit);
}
