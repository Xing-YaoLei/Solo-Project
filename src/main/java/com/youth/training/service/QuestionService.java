package com.youth.training.service;

import com.youth.training.dto.StatusChangeDTO;
import com.youth.training.entity.Question;
import com.youth.training.entity.QuestionTag;
import com.youth.training.entity.Tag;
import com.youth.training.enums.CommonStatus;
import com.youth.training.repository.QuestionRepository;
import com.youth.training.repository.QuestionTagRepository;
import com.youth.training.repository.TagRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class QuestionService {

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private QuestionTagRepository questionTagRepository;

    @Autowired
    private TagRepository tagRepository;

    @Autowired
    private HomeworkService homeworkService;

    @Autowired
    private StatusHistoryService statusHistoryService;

    @Transactional
    @CacheEvict(value = {"question", "questionList", "questionTags"}, allEntries = true)
    public Question createQuestion(Question question, List<Long> tagIds) {
        if (question.getStatus() == null) {
            question.setStatus(CommonStatus.ACTIVE.getCode());
        }
        Question saved = questionRepository.save(question);

        if (tagIds != null && !tagIds.isEmpty()) {
            for (Long tagId : tagIds) {
                QuestionTag questionTag = new QuestionTag();
                questionTag.setQuestionId(saved.getId());
                questionTag.setTagId(tagId);
                questionTagRepository.save(questionTag);
            }
        }

        StatusChangeDTO statusDTO = new StatusChangeDTO();
        statusDTO.setBusinessId(saved.getId());
        statusDTO.setBusinessType("QUESTION");
        statusDTO.setOldStatus("");
        statusDTO.setNewStatus(saved.getStatus());
        statusDTO.setChangeReason("创建题目");
        statusDTO.setOperator("SYSTEM");
        statusHistoryService.saveStatusHistory(statusDTO);

        return saved;
    }

    @Transactional
    @CacheEvict(value = {"question", "questionList", "questionTags"}, allEntries = true)
    public Question updateQuestion(Long id, Question question, List<Long> tagIds) {
        Question existing = questionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("题目不存在: " + id));

        String oldStatus = existing.getStatus();

        existing.setHomeworkId(question.getHomeworkId());
        existing.setQuestionText(question.getQuestionText());
        existing.setAnswer(question.getAnswer());
        existing.setScore(question.getScore());
        existing.setQuestionType(question.getQuestionType());
        existing.setSortOrder(question.getSortOrder());
        existing.setStatus(question.getStatus());

        Question saved = questionRepository.save(existing);

        if (!Objects.equals(oldStatus, question.getStatus())) {
            StatusChangeDTO statusDTO = new StatusChangeDTO();
            statusDTO.setBusinessId(saved.getId());
            statusDTO.setBusinessType("QUESTION");
            statusDTO.setOldStatus(oldStatus);
            statusDTO.setNewStatus(question.getStatus());
            statusDTO.setChangeReason("更新题目状态");
            statusDTO.setOperator("SYSTEM");
            statusHistoryService.saveStatusHistory(statusDTO);
        }

        if (tagIds != null) {
            questionTagRepository.deleteByQuestionId(id);
            for (Long tagId : tagIds) {
                QuestionTag questionTag = new QuestionTag();
                questionTag.setQuestionId(id);
                questionTag.setTagId(tagId);
                questionTagRepository.save(questionTag);
            }
        }

        return saved;
    }

    @Transactional
    @CacheEvict(value = {"question", "questionList", "questionTags"}, allEntries = true)
    public Question deleteQuestion(Long id) {
        Question existing = questionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("题目不存在: " + id));

        String oldStatus = existing.getStatus();
        existing.setStatus(CommonStatus.DELETED.getCode());
        Question saved = questionRepository.save(existing);

        StatusChangeDTO statusDTO = new StatusChangeDTO();
        statusDTO.setBusinessId(id);
        statusDTO.setBusinessType("QUESTION");
        statusDTO.setOldStatus(oldStatus);
        statusDTO.setNewStatus(CommonStatus.DELETED.getCode());
        statusDTO.setChangeReason("删除题目");
        statusDTO.setOperator("SYSTEM");
        statusHistoryService.saveStatusHistory(statusDTO);

        return saved;
    }

    @Cacheable(value = "question", key = "#id")
    public Question getQuestion(Long id) {
        return questionRepository.findById(id).orElse(null);
    }

    @Cacheable(value = "questionList", key = "'homework:' + #homeworkId")
    public List<Question> listQuestionsByHomework(Long homeworkId) {
        return questionRepository.findByHomeworkIdOrderBySortOrderAsc(homeworkId);
    }

    @Cacheable(value = "questionTags", key = "'question:' + #questionId")
    public List<Tag> getTagsByQuestion(Long questionId) {
        List<QuestionTag> questionTags = questionTagRepository.findByQuestionId(questionId);
        List<Long> tagIds = questionTags.stream()
                .map(QuestionTag::getTagId)
                .collect(Collectors.toList());
        if (tagIds.isEmpty()) {
            return new ArrayList<>();
        }
        return tagRepository.findAllById(tagIds);
    }
}
