package com.testdrive.repository;

import com.testdrive.entity.FeedbackChangeLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FeedbackChangeLogRepository extends JpaRepository<FeedbackChangeLog, Long> {
    List<FeedbackChangeLog> findByFeedbackIdOrderByChangedAtDesc(Long feedbackId);
}
