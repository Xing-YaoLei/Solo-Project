package com.youth.training.service;

import com.youth.training.dto.ExceptionOrderDTO;
import com.youth.training.dto.StatusChangeDTO;
import com.youth.training.entity.Course;
import com.youth.training.entity.Homework;
import com.youth.training.entity.LearningProgress;
import com.youth.training.entity.Question;
import com.youth.training.entity.QuestionTag;
import com.youth.training.entity.ScoreFeedback;
import com.youth.training.entity.Student;
import com.youth.training.entity.Tag;
import com.youth.training.enums.CommonStatus;
import com.youth.training.enums.ExceptionType;
import com.youth.training.enums.PriorityLevel;
import com.youth.training.enums.ProgressType;
import com.youth.training.repository.ChapterRepository;
import com.youth.training.repository.CourseRepository;
import com.youth.training.repository.HomeworkRepository;
import com.youth.training.repository.LearningProgressRepository;
import com.youth.training.repository.QuestionRepository;
import com.youth.training.repository.QuestionTagRepository;
import com.youth.training.repository.ScoreFeedbackRepository;
import com.youth.training.repository.StudentRepository;
import com.youth.training.repository.TagRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class FlowIntegrationService {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private ChapterRepository chapterRepository;

    @Autowired
    private HomeworkRepository homeworkRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private QuestionTagRepository questionTagRepository;

    @Autowired
    private TagRepository tagRepository;

    @Autowired
    private ScoreFeedbackRepository scoreFeedbackRepository;

    @Autowired
    private LearningProgressRepository learningProgressRepository;

    @Autowired
    private LearningProgressService learningProgressService;

    @Autowired
    private ExceptionOrderService exceptionOrderService;

    @Autowired
    private StatusHistoryService statusHistoryService;

    @Transactional
    @CacheEvict(value = {"learningProgress", "studentProgress", "warningProgress"}, allEntries = true)
    public void onHomeworkScored(Long studentId, Long homeworkId, Long courseId, Long chapterId) {
        LearningProgress homeworkProgress = learningProgressService.calculateChapterProgress(
                studentId, courseId, chapterId);
        LearningProgress courseProgress = learningProgressService.calculateCourseProgress(
                studentId, courseId);

        checkScoreDropException(studentId, courseId, homeworkId);
    }

    private void checkScoreDropException(Long studentId, Long courseId, Long homeworkId) {
        List<ScoreFeedback> feedbacks = scoreFeedbackRepository.findByStudentIdAndHomeworkId(studentId, homeworkId);
        if (feedbacks.isEmpty()) {
            return;
        }

        double avgScore = feedbacks.stream()
                .filter(f -> f.getScore() != null)
                .mapToDouble(ScoreFeedback::getScore)
                .average()
                .orElse(0.0);

        double avgTotal = feedbacks.stream()
                .filter(f -> f.getTotalScore() != null)
                .mapToDouble(ScoreFeedback::getTotalScore)
                .average()
                .orElse(100.0);

        double scoreRate = avgTotal > 0 ? (avgScore / avgTotal * 100.0) : 0.0;

        if (scoreRate < 30.0) {
            boolean existsActive = exceptionOrderService.existsActiveException(
                    studentId, ExceptionType.SCORE_DROP.getCode());
            if (!existsActive) {
                Student student = studentRepository.findById(studentId).orElse(null);
                Course course = courseRepository.findById(courseId).orElse(null);

                ExceptionOrderDTO dto = new ExceptionOrderDTO();
                dto.setExceptionType(ExceptionType.SCORE_DROP.getCode());
                dto.setPriority(PriorityLevel.HIGH.getCode());
                dto.setTitle("【成绩下滑】" + (student != null ? student.getStudentName() : "")
                        + "-" + (course != null ? course.getCourseName() : "") + " 作业成绩异常");
                dto.setDescription("学生作业得分率仅为" + String.format("%.1f", scoreRate)
                        + "%，远低于正常水平，请及时跟进辅导。");
                dto.setImpactScope("影响学习信心与续费意愿，可能导致学生流失");
                dto.setStudentId(studentId);
                dto.setCourseId(courseId);
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

    @Transactional(readOnly = true)
    public Map<String, Object> getStudentFullProgressDetail(Long studentId, Long courseId) {
        Map<String, Object> result = new HashMap<>();

        Student student = studentRepository.findById(studentId).orElse(null);
        result.put("student", student);

        Course course = courseRepository.findById(courseId).orElse(null);
        result.put("course", course);

        LearningProgress courseProgress = learningProgressRepository
                .findByStudentIdAndCourseIdAndProgressType(studentId, courseId, ProgressType.COURSE.getCode())
                .orElse(null);
        result.put("courseProgress", courseProgress);

        List<LearningProgress> chapterProgressList = learningProgressRepository
                .findByStudentIdAndProgressType(studentId, ProgressType.CHAPTER.getCode());
        List<LearningProgress> filteredChapterProgress = chapterProgressList.stream()
                .filter(p -> p.getCourseId().equals(courseId))
                .collect(Collectors.toList());
        result.put("chapterProgressList", filteredChapterProgress);

        List<LearningProgress> homeworkProgressList = learningProgressRepository
                .findByStudentIdAndProgressType(studentId, ProgressType.HOMEWORK.getCode());
        List<LearningProgress> filteredHomeworkProgress = homeworkProgressList.stream()
                .filter(p -> p.getCourseId().equals(courseId))
                .collect(Collectors.toList());
        result.put("homeworkProgressList", filteredHomeworkProgress);

        List<Homework> homeworks = homeworkRepository.findByCourseIdOrderBySortOrderAsc(courseId);
        List<ScoreFeedback> allFeedbacks = new ArrayList<>();
        for (Homework hw : homeworks) {
            List<ScoreFeedback> hwFeedbacks = scoreFeedbackRepository
                    .findByStudentIdAndHomeworkId(studentId, hw.getId());
            allFeedbacks.addAll(hwFeedbacks);
        }
        result.put("scoreFeedbacks", allFeedbacks);

        List<Long> questionIds = new ArrayList<>();
        for (ScoreFeedback fb : allFeedbacks) {
            if (fb.getQuestionId() != null) {
                questionIds.add(fb.getQuestionId());
            }
        }
        if (!questionIds.isEmpty()) {
            List<QuestionTag> questionTags = questionTagRepository.findByQuestionIdIn(questionIds);
            List<Long> tagIds = questionTags.stream()
                    .map(QuestionTag::getTagId)
                    .distinct()
                    .collect(Collectors.toList());
            if (!tagIds.isEmpty()) {
                List<Tag> tags = tagRepository.findAllById(tagIds);
                result.put("relatedTags", tags);
            }

            Map<Long, List<Long>> questionTagMap = new HashMap<>();
            for (QuestionTag qt : questionTags) {
                questionTagMap.computeIfAbsent(qt.getQuestionId(), k -> new ArrayList<>())
                        .add(qt.getTagId());
            }
            result.put("questionTagMap", questionTagMap);
        }

        return result;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getStudentWeakPointAnalysis(Long studentId) {
        Map<String, Object> result = new HashMap<>();

        Student student = studentRepository.findById(studentId).orElse(null);
        result.put("student", student);

        List<ScoreFeedback> allFeedbacks = scoreFeedbackRepository.findByStudentId(studentId);
        List<ScoreFeedback> lowScoreFeedbacks = allFeedbacks.stream()
                .filter(f -> f.getScore() != null && f.getTotalScore() != null)
                .filter(f -> (f.getScore() / f.getTotalScore()) < 0.6)
                .collect(Collectors.toList());
        result.put("lowScoreFeedbackCount", lowScoreFeedbacks.size());
        result.put("totalFeedbackCount", allFeedbacks.size());

        Map<String, Integer> tagWeakCount = new HashMap<>();
        for (ScoreFeedback fb : lowScoreFeedbacks) {
            if (fb.getQuestionId() != null) {
                List<QuestionTag> qts = questionTagRepository.findByQuestionId(fb.getQuestionId());
                for (QuestionTag qt : qts) {
                    Tag tag = tagRepository.findById(qt.getTagId()).orElse(null);
                    if (tag != null) {
                        tagWeakCount.merge(tag.getTagName(), 1, Integer::sum);
                    }
                }
            }
        }

        List<Map<String, Object>> weakPoints = tagWeakCount.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .map(entry -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("tagName", entry.getKey());
                    item.put("weakCount", entry.getValue());
                    return item;
                })
                .collect(Collectors.toList());
        result.put("weakPoints", weakPoints);

        return result;
    }
}
