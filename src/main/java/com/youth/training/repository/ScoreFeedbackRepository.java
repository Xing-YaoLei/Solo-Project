package com.youth.training.repository;

import com.youth.training.entity.ScoreFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScoreFeedbackRepository extends JpaRepository<ScoreFeedback, Long>, JpaSpecificationExecutor<ScoreFeedback> {
    List<ScoreFeedback> findByStudentId(Long studentId);
    List<ScoreFeedback> findByHomeworkId(Long homeworkId);
    List<ScoreFeedback> findByStudentIdAndHomeworkId(Long studentId, Long homeworkId);
    List<ScoreFeedback> findByGradeLevel(String gradeLevel);

    List<ScoreFeedback> findByStudentIdAndStatus(Long studentId, String status);

    List<ScoreFeedback> findByStatus(String status);
}
