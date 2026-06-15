package com.youth.training.repository;

import com.youth.training.entity.LearningProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LearningProgressRepository extends JpaRepository<LearningProgress, Long>, JpaSpecificationExecutor<LearningProgress> {
    List<LearningProgress> findByStudentId(Long studentId);
    List<LearningProgress> findByStudentIdAndProgressType(Long studentId, String progressType);
    Optional<LearningProgress> findByStudentIdAndCourseIdAndProgressType(Long studentId, Long courseId, String progressType);
    List<LearningProgress> findByCourseIdAndProgressType(Long courseId, String progressType);
    List<LearningProgress> findByCompletionRateLessThanAndProgressType(Double rate, String progressType);
}
