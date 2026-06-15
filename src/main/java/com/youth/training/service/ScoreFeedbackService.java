package com.youth.training.service;

import com.youth.training.dto.ExceptionOrderDTO;
import com.youth.training.dto.StatusChangeDTO;
import com.youth.training.entity.Course;
import com.youth.training.entity.Homework;
import com.youth.training.entity.QuestionTag;
import com.youth.training.entity.ScoreFeedback;
import com.youth.training.entity.Student;
import com.youth.training.entity.Tag;
import com.youth.training.enums.ExceptionType;
import com.youth.training.enums.PriorityLevel;
import com.youth.training.repository.CourseRepository;
import com.youth.training.repository.HomeworkRepository;
import com.youth.training.repository.QuestionRepository;
import com.youth.training.repository.QuestionTagRepository;
import com.youth.training.repository.ScoreFeedbackRepository;
import com.youth.training.repository.StudentRepository;
import com.youth.training.repository.TagRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class ScoreFeedbackService {

    @Autowired
    private ScoreFeedbackRepository scoreFeedbackRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private QuestionTagRepository questionTagRepository;

    @Autowired
    private TagRepository tagRepository;

    @Autowired
    private LearningProgressService learningProgressService;

    @Autowired
    private StatusHistoryService statusHistoryService;

    @Autowired
    private ExceptionOrderService exceptionOrderService;

    @Autowired
    private HomeworkRepository homeworkRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Transactional
    @CacheEvict(value = {"scoreFeedback", "studentScoreFeedback", "homeworkScoreFeedback", "statusScoreFeedback"}, allEntries = true)
    public ScoreFeedback createFeedback(ScoreFeedback feedback) {
        feedback.setStatus(feedback.getStatus() != null ? feedback.getStatus() : "PENDING");
        ScoreFeedback saved = scoreFeedbackRepository.save(feedback);

        StatusChangeDTO statusDTO = new StatusChangeDTO();
        statusDTO.setBusinessId(saved.getId());
        statusDTO.setBusinessType("SCORE_FEEDBACK");
        statusDTO.setOldStatus("");
        statusDTO.setNewStatus(saved.getStatus());
        statusDTO.setChangeReason("创建评分反馈记录");
        statusDTO.setOperator("SYSTEM");
        statusHistoryService.saveStatusHistory(statusDTO);

        return saved;
    }

    @Transactional
    @CacheEvict(value = {"scoreFeedback", "studentScoreFeedback", "homeworkScoreFeedback", "statusScoreFeedback"}, allEntries = true)
    public ScoreFeedback reviewFeedback(Long id, Double score, String teacherComment, String gradeLevel, String weakPoints, String reviewedBy) {
        ScoreFeedback feedback = scoreFeedbackRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("评分反馈不存在: " + id));

        String oldStatus = feedback.getStatus();
        feedback.setScore(score);
        feedback.setTeacherComment(teacherComment);
        feedback.setGradeLevel(gradeLevel);
        feedback.setWeakPoints(weakPoints);
        feedback.setReviewedBy(reviewedBy);
        feedback.setReviewTime(LocalDateTime.now());
        feedback.setStatus("REVIEWED");

        ScoreFeedback saved = scoreFeedbackRepository.save(feedback);

        StatusChangeDTO statusDTO = new StatusChangeDTO();
        statusDTO.setBusinessId(saved.getId());
        statusDTO.setBusinessType("SCORE_FEEDBACK");
        statusDTO.setOldStatus(oldStatus);
        statusDTO.setNewStatus("REVIEWED");
        statusDTO.setChangeReason("评分审核: 分数=" + score + ", 等级=" + gradeLevel);
        statusDTO.setOperator(reviewedBy);
        statusHistoryService.saveStatusHistory(statusDTO);

        if (saved.getStudentId() != null && saved.getHomeworkId() != null) {
            triggerProgressAndExceptionCheck(saved);
        }

        return saved;
    }

    private void triggerProgressAndExceptionCheck(ScoreFeedback feedback) {
        try {
            Homework homework = homeworkRepository.findById(feedback.getHomeworkId()).orElse(null);
            if (homework == null) {
                return;
            }

            learningProgressService.calculateChapterProgress(
                    feedback.getStudentId(), homework.getCourseId(), homework.getChapterId());
            learningProgressService.calculateCourseProgress(
                    feedback.getStudentId(), homework.getCourseId());

            if (feedback.getScore() != null && feedback.getTotalScore() != null && feedback.getTotalScore() > 0) {
                double scoreRate = feedback.getScore() / feedback.getTotalScore() * 100.0;
                if (scoreRate < 30.0) {
                    boolean existsActive = exceptionOrderService.existsActiveException(
                            feedback.getStudentId(), ExceptionType.SCORE_DROP.getCode());
                    if (!existsActive) {
                        Student student = studentRepository.findById(feedback.getStudentId()).orElse(null);
                        Course course = courseRepository.findById(homework.getCourseId()).orElse(null);

                        ExceptionOrderDTO dto = new ExceptionOrderDTO();
                        dto.setExceptionType(ExceptionType.SCORE_DROP.getCode());
                        dto.setPriority(PriorityLevel.HIGH.getCode());
                        dto.setTitle("【成绩下滑】" + (student != null ? student.getStudentName() : "")
                                + "-" + (course != null ? course.getCourseName() : "") + " 作业得分率异常");
                        dto.setDescription("学生作业得分率仅为" + String.format("%.1f", scoreRate)
                                + "%，远低于正常水平，请及时跟进辅导。");
                        dto.setImpactScope("影响学习信心与续费意愿，可能导致学生流失");
                        dto.setStudentId(feedback.getStudentId());
                        dto.setCourseId(homework.getCourseId());
                        dto.setCompletionRateBefore(scoreRate);
                        dto.setCreatedBy("SYSTEM");
                        if (student != null) {
                            dto.setResponsiblePerson(student.getResponsibleTeacher());
                        }
                        dto.setHandlingDepartment("教学部");
                        exceptionOrderService.createExceptionOrder(dto);
                    }
                }
            }
        } catch (Exception e) {
        }
    }

    @Transactional
    @CacheEvict(value = {"scoreFeedback", "studentScoreFeedback", "homeworkScoreFeedback", "statusScoreFeedback"}, allEntries = true)
    public ScoreFeedback updateFeedbackStatus(Long id, String newStatus, String reason, String operator) {
        ScoreFeedback feedback = scoreFeedbackRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("评分反馈不存在: " + id));

        String oldStatus = feedback.getStatus();
        feedback.setStatus(newStatus);
        ScoreFeedback saved = scoreFeedbackRepository.save(feedback);

        if (!Objects.equals(oldStatus, newStatus)) {
            StatusChangeDTO statusDTO = new StatusChangeDTO();
            statusDTO.setBusinessId(saved.getId());
            statusDTO.setBusinessType("SCORE_FEEDBACK");
            statusDTO.setOldStatus(oldStatus);
            statusDTO.setNewStatus(newStatus);
            statusDTO.setChangeReason(reason);
            statusDTO.setOperator(operator);
            statusHistoryService.saveStatusHistory(statusDTO);
        }

        return saved;
    }

    @Cacheable(value = "scoreFeedback", key = "#id")
    public ScoreFeedback getFeedback(Long id) {
        return scoreFeedbackRepository.findById(id).orElse(null);
    }

    @Cacheable(value = "studentScoreFeedback", key = "'student:' + #studentId")
    public List<ScoreFeedback> listFeedbackByStudent(Long studentId) {
        return scoreFeedbackRepository.findByStudentId(studentId);
    }

    @Cacheable(value = "homeworkScoreFeedback", key = "'homework:' + #homeworkId")
    public List<ScoreFeedback> listFeedbackByHomework(Long homeworkId) {
        return scoreFeedbackRepository.findByHomeworkId(homeworkId);
    }

    @Cacheable(value = "statusScoreFeedback", key = "'status:' + #status")
    public List<ScoreFeedback> listFeedbackByStatus(String status) {
        return scoreFeedbackRepository.findByStatus(status);
    }

    @Cacheable(value = "studentWeakPoints", key = "'student:' + #studentId")
    public List<String> getWeakPointTagsByStudent(Long studentId) {
        List<ScoreFeedback> feedbacks = scoreFeedbackRepository.findByStudentId(studentId);

        List<Long> questionIds = feedbacks.stream()
                .filter(f -> f.getQuestionId() != null)
                .map(ScoreFeedback::getQuestionId)
                .distinct()
                .collect(Collectors.toList());

        if (questionIds.isEmpty()) {
            return new ArrayList<>();
        }

        List<QuestionTag> questionTags = questionTagRepository.findByQuestionIdIn(questionIds);

        List<Long> tagIds = questionTags.stream()
                .map(QuestionTag::getTagId)
                .distinct()
                .collect(Collectors.toList());

        List<String> tagNames = new ArrayList<>();
        for (Long tagId : tagIds) {
            tagRepository.findById(tagId).ifPresent(tag -> tagNames.add(tag.getTagName()));
        }

        return tagNames.stream().distinct().collect(Collectors.toList());
    }
}
