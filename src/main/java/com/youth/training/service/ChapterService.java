package com.youth.training.service;

import com.youth.training.dto.StatusChangeDTO;
import com.youth.training.entity.Chapter;
import com.youth.training.entity.Homework;
import com.youth.training.enums.CommonStatus;
import com.youth.training.repository.ChapterRepository;
import com.youth.training.repository.HomeworkRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

@Service
public class ChapterService {

    @Autowired
    private ChapterRepository chapterRepository;

    @Autowired
    private HomeworkRepository homeworkRepository;

    @Autowired
    private CourseService courseService;

    @Autowired
    private StatusHistoryService statusHistoryService;

    @Transactional
    @CacheEvict(value = "chapters", allEntries = true)
    public Chapter createChapter(Chapter chapter) {
        if (chapter.getStatus() == null) {
            chapter.setStatus(CommonStatus.ACTIVE.getCode());
        }
        Chapter saved = chapterRepository.save(chapter);

        courseService.recalculateCourseStats(chapter.getCourseId());

        StatusChangeDTO statusDTO = new StatusChangeDTO();
        statusDTO.setBusinessId(saved.getId());
        statusDTO.setBusinessType("CHAPTER");
        statusDTO.setOldStatus("");
        statusDTO.setNewStatus(saved.getStatus());
        statusDTO.setChangeReason("创建章节");
        statusDTO.setOperator("SYSTEM");
        statusHistoryService.saveStatusHistory(statusDTO);

        return saved;
    }

    @Transactional
    @CacheEvict(value = "chapters", allEntries = true)
    public Chapter updateChapter(Long id, Chapter chapter) {
        Chapter existing = chapterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("章节不存在: " + id));

        String oldStatus = existing.getStatus();
        Long oldCourseId = existing.getCourseId();

        existing.setCourseId(chapter.getCourseId());
        existing.setChapterNo(chapter.getChapterNo());
        existing.setChapterName(chapter.getChapterName());
        existing.setContent(chapter.getContent());
        existing.setStudyHours(chapter.getStudyHours());
        existing.setStatus(chapter.getStatus());
        existing.setSortOrder(chapter.getSortOrder());

        Chapter saved = chapterRepository.save(existing);

        if (!Objects.equals(oldStatus, chapter.getStatus())) {
            StatusChangeDTO statusDTO = new StatusChangeDTO();
            statusDTO.setBusinessId(saved.getId());
            statusDTO.setBusinessType("CHAPTER");
            statusDTO.setOldStatus(oldStatus);
            statusDTO.setNewStatus(chapter.getStatus());
            statusDTO.setChangeReason("更新章节状态");
            statusDTO.setOperator("SYSTEM");
            statusHistoryService.saveStatusHistory(statusDTO);
        }

        if (!Objects.equals(oldCourseId, chapter.getCourseId())) {
            courseService.recalculateCourseStats(oldCourseId);
            courseService.recalculateCourseStats(chapter.getCourseId());
        } else {
            courseService.recalculateCourseStats(chapter.getCourseId());
        }

        return saved;
    }

    @Transactional
    @CacheEvict(value = "chapters", allEntries = true)
    public Chapter deleteChapter(Long id) {
        Chapter existing = chapterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("章节不存在: " + id));

        String oldStatus = existing.getStatus();
        existing.setStatus(CommonStatus.DELETED.getCode());
        Chapter saved = chapterRepository.save(existing);

        StatusChangeDTO statusDTO = new StatusChangeDTO();
        statusDTO.setBusinessId(saved.getId());
        statusDTO.setBusinessType("CHAPTER");
        statusDTO.setOldStatus(oldStatus);
        statusDTO.setNewStatus(CommonStatus.DELETED.getCode());
        statusDTO.setChangeReason("删除章节");
        statusDTO.setOperator("SYSTEM");
        statusHistoryService.saveStatusHistory(statusDTO);

        courseService.recalculateCourseStats(saved.getCourseId());

        return saved;
    }

    @Cacheable(value = "chapters", key = "'detail:' + #id")
    public Chapter getChapter(Long id) {
        return chapterRepository.findById(id).orElse(null);
    }

    @Cacheable(value = "chapters", key = "'course:' + #courseId")
    public List<Chapter> listChaptersByCourse(Long courseId) {
        return chapterRepository.findByCourseIdOrderBySortOrderAsc(courseId);
    }

    public List<Homework> getHomeworkByChapter(Long chapterId) {
        return homeworkRepository.findByChapterIdOrderBySortOrderAsc(chapterId);
    }
}
