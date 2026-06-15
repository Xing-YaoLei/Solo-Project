package com.youth.training.repository;

import com.youth.training.entity.Chapter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChapterRepository extends JpaRepository<Chapter, Long>, JpaSpecificationExecutor<Chapter> {
    List<Chapter> findByCourseIdOrderBySortOrderAsc(Long courseId);
    List<Chapter> findByCourseIdAndStatus(Long courseId, String status);
    int countByCourseId(Long courseId);

    List<Chapter> findByCourseId(Long courseId);
}
