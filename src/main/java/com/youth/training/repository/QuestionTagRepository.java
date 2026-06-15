package com.youth.training.repository;

import com.youth.training.entity.QuestionTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionTagRepository extends JpaRepository<QuestionTag, Long> {
    List<QuestionTag> findByQuestionId(Long questionId);
    List<QuestionTag> findByTagId(Long tagId);
    void deleteByQuestionId(Long questionId);

    List<QuestionTag> findByQuestionIdIn(List<Long> questionIds);
}
