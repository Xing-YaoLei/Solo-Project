package com.renewal.repository;

import com.renewal.entity.ScoreFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScoreFeedbackRepository extends JpaRepository<ScoreFeedback, Long> {

    List<ScoreFeedback> findByEnrollmentIdOrderByRecordedAtDesc(Long enrollmentId);

    @Query("SELECT sf FROM ScoreFeedback sf WHERE sf.enrollmentId = :enrollmentId AND sf.scoreType = :scoreType ORDER BY sf.recordedAt DESC")
    List<ScoreFeedback> findByEnrollmentIdAndScoreType(@Param("enrollmentId") Long enrollmentId, @Param("scoreType") ScoreFeedback.ScoreType scoreType);
}
