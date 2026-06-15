package com.youth.training.service;

import com.youth.training.dto.StatusChangeDTO;
import com.youth.training.entity.Homework;
import com.youth.training.entity.Question;
import com.youth.training.enums.CommonStatus;
import com.youth.training.repository.HomeworkRepository;
import com.youth.training.repository.QuestionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

@Service
public class HomeworkService {

    @Autowired
    private HomeworkRepository homeworkRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private ChapterService chapterService;

    @Autowired
    private CourseService courseService;

    @Autowired
    private StatusHistoryService statusHistoryService;

    @Transactional
    @CacheEvict(value = {"homework", "homeworkByCourse"}, allEntries = true)
    public Homework createHomework(Homework homework) {
        if (homework.getStatus() == null) {
            homework.setStatus(CommonStatus.ACTIVE.getCode());
        }
        Homework saved = homeworkRepository.save(homework);

        courseService.recalculateCourseStats(homework.getCourseId());

        StatusChangeDTO dto = new StatusChangeDTO();
        dto.setBusinessId(saved.getId());
        dto.setBusinessType("HOMEWORK");
        dto.setOldStatus("");
        dto.setNewStatus(saved.getStatus());
        dto.setChangeReason("创建作业: " + saved.getHomeworkName());
        dto.setOperator("SYSTEM");
        statusHistoryService.saveStatusHistory(dto);

        return saved;
    }

    @Transactional
    @CacheEvict(value = {"homework", "homeworkByCourse"}, allEntries = true)
    public Homework updateHomework(Long id, Homework homework) {
        Homework existing = homeworkRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("作业不存在: " + id));

        String oldStatus = existing.getStatus();
        Long oldCourseId = existing.getCourseId();

        existing.setCourseId(homework.getCourseId());
        existing.setChapterId(homework.getChapterId());
        existing.setHomeworkName(homework.getHomeworkName());
        existing.setDescription(homework.getDescription());
        existing.setTotalQuestions(homework.getTotalQuestions());
        existing.setTotalScore(homework.getTotalScore());
        existing.setDeadline(homework.getDeadline());
        existing.setStatus(homework.getStatus());
        existing.setSortOrder(homework.getSortOrder());

        Homework saved = homeworkRepository.save(existing);

        if (!Objects.equals(oldStatus, saved.getStatus())) {
            StatusChangeDTO dto = new StatusChangeDTO();
            dto.setBusinessId(saved.getId());
            dto.setBusinessType("HOMEWORK");
            dto.setOldStatus(oldStatus);
            dto.setNewStatus(saved.getStatus());
            dto.setChangeReason("更新作业状态");
            dto.setOperator("SYSTEM");
            statusHistoryService.saveStatusHistory(dto);
        }

        if (!Objects.equals(oldCourseId, saved.getCourseId())) {
            courseService.recalculateCourseStats(oldCourseId);
            courseService.recalculateCourseStats(saved.getCourseId());
        } else {
            courseService.recalculateCourseStats(saved.getCourseId());
        }

        return saved;
    }

    @Transactional
    @CacheEvict(value = {"homework", "homeworkByCourse"}, allEntries = true)
    public Homework deleteHomework(Long id) {
        Homework homework = homeworkRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("作业不存在: " + id));

        String oldStatus = homework.getStatus();
        homework.setStatus(CommonStatus.DELETED.getCode());
        Homework saved = homeworkRepository.save(homework);

        StatusChangeDTO dto = new StatusChangeDTO();
        dto.setBusinessId(saved.getId());
        dto.setBusinessType("HOMEWORK");
        dto.setOldStatus(oldStatus);
        dto.setNewStatus(CommonStatus.DELETED.getCode());
        dto.setChangeReason("删除作业");
        dto.setOperator("SYSTEM");
        statusHistoryService.saveStatusHistory(dto);

        courseService.recalculateCourseStats(saved.getCourseId());

        return saved;
    }

    @Cacheable(value = "homework", key = "#id")
    public Homework getHomework(Long id) {
        return homeworkRepository.findById(id).orElse(null);
    }

    @Cacheable(value = "homeworkByCourse", key = "'course:' + #courseId")
    public List<Homework> listHomeworkByCourse(Long courseId) {
        return homeworkRepository.findByCourseIdOrderBySortOrderAsc(courseId);
    }

    public List<Homework> listHomeworkByChapter(Long chapterId) {
        return homeworkRepository.findByChapterIdOrderBySortOrderAsc(chapterId);
    }

    public List<Question> getQuestionsByHomework(Long homeworkId) {
        return questionRepository.findByHomeworkIdOrderBySortOrderAsc(homeworkId);
    }
}
