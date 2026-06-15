package com.youth.training.repository;

import com.youth.training.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long>, JpaSpecificationExecutor<Question> {
    List<Question> findByHomeworkIdOrderBySortOrderAsc(Long homeworkId);
    int countByHomeworkId(Long homeworkId);
}
