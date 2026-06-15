package com.training.renewal.repository;

import com.training.renewal.entity.ProgressComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProgressCommentRepository extends JpaRepository<ProgressComment, Long> {

    List<ProgressComment> findByStudentNoOrderByCreateTimeDesc(String studentNo);

    List<ProgressComment> findByConsultantIdOrderByCreateTimeDesc(String consultantId);

    List<ProgressComment> findByRiskLevelOrderByCreateTimeDesc(String riskLevel);

    @Query("SELECT p.riskLevel, COUNT(p) FROM ProgressComment p GROUP BY p.riskLevel")
    List<Object[]> getRiskLevelDistribution();

    @Query("SELECT p.consultantId, p.consultantName, COUNT(p) FROM ProgressComment p " +
           "GROUP BY p.consultantId, p.consultantName")
    List<Object[]> getCommentStatsByConsultant();

    @Query("SELECT p FROM ProgressComment p WHERE p.status = :status ORDER BY p.followUpTime ASC")
    List<ProgressComment> findByStatusOrderByFollowUpTimeAsc(@Param("status") String status);
}
