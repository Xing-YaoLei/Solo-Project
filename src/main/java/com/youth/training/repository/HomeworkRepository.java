package com.youth.training.repository;

import com.youth.training.entity.Homework;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HomeworkRepository extends JpaRepository<Homework, Long>, JpaSpecificationExecutor<Homework> {
    List<Homework> findByCourseIdOrderBySortOrderAsc(Long courseId);
    List<Homework> findByChapterIdOrderBySortOrderAsc(Long chapterId);
    List<Homework> findByCourseIdAndStatus(Long courseId, String status);
    int countByCourseId(Long courseId);
    int countByChapterId(Long chapterId);
}
