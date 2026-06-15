package com.training.renewal.repository;

import com.training.renewal.entity.ParentFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ParentFeedbackRepository extends JpaRepository<ParentFeedback, Long> {

    List<ParentFeedback> findByStudentNoOrderByFeedbackTimeDesc(String studentNo);

    List<ParentFeedback> findByBatchId(String batchId);

    @Query("SELECT p.feedbackType, COUNT(p) FROM ParentFeedback p GROUP BY p.feedbackType")
    List<Object[]> getFeedbackTypeDistribution();

    @Query("SELECT p.sentiment, COUNT(p) FROM ParentFeedback p GROUP BY p.sentiment")
    List<Object[]> getSentimentDistribution();

    @Query("SELECT p FROM ParentFeedback p WHERE p.feedbackTime BETWEEN :startTime AND :endTime " +
           "ORDER BY p.feedbackTime DESC")
    List<ParentFeedback> findByTimeRange(
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    @Query("SELECT COUNT(p) FROM ParentFeedback p WHERE p.handleStatus = :status")
    long countByHandleStatus(@Param("status") String status);

    @Query("SELECT p.feedbackChannel, COUNT(p) FROM ParentFeedback p GROUP BY p.feedbackChannel")
    List<Object[]> getChannelDistribution();
}
