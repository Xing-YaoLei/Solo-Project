package com.youth.training.service;

import com.youth.training.dto.StatusChangeDTO;
import com.youth.training.entity.Chapter;
import com.youth.training.entity.Homework;
import com.youth.training.entity.LearningProgress;
import com.youth.training.enums.CommonStatus;
import com.youth.training.enums.ProgressType;
import com.youth.training.repository.ChapterRepository;
import com.youth.training.repository.HomeworkRepository;
import com.youth.training.repository.LearningProgressRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
public class LearningProgressService {

    @Autowired
    private LearningProgressRepository learningProgressRepository;

    @Autowired
    private ChapterRepository chapterRepository;

    @Autowired
    private HomeworkRepository homeworkRepository;

    @Autowired
    private StatusHistoryService statusHistoryService;

    @Transactional
    @CacheEvict(value = {"learningProgress", "studentProgress", "warningProgress"}, allEntries = true)
    public LearningProgress calculateCourseProgress(Long studentId, Long courseId) {
        List<Chapter> chapters = chapterRepository.findByCourseIdAndStatus(courseId, CommonStatus.ACTIVE.getCode());
        int totalChapters = chapters.size();

        int completedChapters = 0;
        List<LearningProgress> allChapterProgress = learningProgressRepository
                .findByStudentIdAndProgressType(studentId, ProgressType.CHAPTER.getCode());

        for (Chapter chapter : chapters) {
            Optional<LearningProgress> chapterProgress = allChapterProgress.stream()
                    .filter(p -> p.getCourseId().equals(courseId))
                    .filter(p -> p.getChapterId() != null && p.getChapterId().equals(chapter.getId()))
                    .filter(p -> p.getCompletionRate() >= 100.0)
                    .findFirst();
            if (chapterProgress.isPresent()) {
                completedChapters++;
            }
        }

        double completionRate = totalChapters > 0 ? (completedChapters * 100.0 / totalChapters) : 0.0;
        completionRate = Math.round(completionRate * 100.0) / 100.0;

        Optional<LearningProgress> existingOpt = learningProgressRepository
                .findByStudentIdAndCourseIdAndProgressType(studentId, courseId, ProgressType.COURSE.getCode());

        LearningProgress progress;
        String oldStatus = "";
        if (existingOpt.isPresent()) {
            progress = existingOpt.get();
            oldStatus = progress.getStatus();
        } else {
            progress = new LearningProgress();
            progress.setStudentId(studentId);
            progress.setCourseId(courseId);
            progress.setProgressType(ProgressType.COURSE.getCode());
            progress.setStatus(CommonStatus.ACTIVE.getCode());
        }

        progress.setCompletionRate(completionRate);
        progress.setCompletedCount(completedChapters);
        progress.setTotalCount(totalChapters);
        progress.setLastStudyTime(LocalDateTime.now());

        String newStatus = completionRate >= 100.0 ? "COMPLETED" : CommonStatus.ACTIVE.getCode();
        progress.setStatus(newStatus);

        LearningProgress saved = learningProgressRepository.save(progress);

        if (!Objects.equals(oldStatus, newStatus)) {
            StatusChangeDTO statusDTO = new StatusChangeDTO();
            statusDTO.setBusinessId(saved.getId());
            statusDTO.setBusinessType("LEARNING_PROGRESS");
            statusDTO.setOldStatus(oldStatus);
            statusDTO.setNewStatus(newStatus);
            statusDTO.setChangeReason("课程进度状态变更，完成率: " + completionRate + "%");
            statusDTO.setOperator("SYSTEM");
            statusHistoryService.saveStatusHistory(statusDTO);
        }

        return saved;
    }

    @Transactional
    @CacheEvict(value = {"learningProgress", "studentProgress", "warningProgress"}, allEntries = true)
    public LearningProgress calculateChapterProgress(Long studentId, Long courseId, Long chapterId) {
        List<Homework> homeworks = homeworkRepository.findByChapterIdOrderBySortOrderAsc(chapterId);
        int totalHomeworks = homeworks.size();

        int completedHomeworks = 0;
        List<LearningProgress> allHomeworkProgress = learningProgressRepository
                .findByStudentIdAndProgressType(studentId, ProgressType.HOMEWORK.getCode());

        for (Homework homework : homeworks) {
            Optional<LearningProgress> homeworkProgress = allHomeworkProgress.stream()
                    .filter(p -> p.getCourseId().equals(courseId))
                    .filter(p -> p.getHomeworkId() != null && p.getHomeworkId().equals(homework.getId()))
                    .filter(p -> p.getCompletionRate() >= 100.0)
                    .findFirst();
            if (homeworkProgress.isPresent()) {
                completedHomeworks++;
            }
        }

        double completionRate = totalHomeworks > 0 ? (completedHomeworks * 100.0 / totalHomeworks) : 0.0;
        completionRate = Math.round(completionRate * 100.0) / 100.0;

        LearningProgress progress;
        String oldStatus = "";

        List<LearningProgress> existingList = learningProgressRepository
                .findByStudentIdAndProgressType(studentId, ProgressType.CHAPTER.getCode());
        Optional<LearningProgress> existingOpt = existingList.stream()
                .filter(p -> p.getCourseId().equals(courseId))
                .filter(p -> chapterId.equals(p.getChapterId()))
                .findFirst();

        if (existingOpt.isPresent()) {
            progress = existingOpt.get();
            oldStatus = progress.getStatus();
        } else {
            progress = new LearningProgress();
            progress.setStudentId(studentId);
            progress.setCourseId(courseId);
            progress.setChapterId(chapterId);
            progress.setProgressType(ProgressType.CHAPTER.getCode());
            progress.setStatus(CommonStatus.ACTIVE.getCode());
        }

        progress.setCompletionRate(completionRate);
        progress.setCompletedCount(completedHomeworks);
        progress.setTotalCount(totalHomeworks);
        progress.setLastStudyTime(LocalDateTime.now());

        String newStatus = completionRate >= 100.0 ? "COMPLETED" : CommonStatus.ACTIVE.getCode();
        progress.setStatus(newStatus);

        LearningProgress saved = learningProgressRepository.save(progress);

        if (!Objects.equals(oldStatus, newStatus)) {
            StatusChangeDTO statusDTO = new StatusChangeDTO();
            statusDTO.setBusinessId(saved.getId());
            statusDTO.setBusinessType("LEARNING_PROGRESS");
            statusDTO.setOldStatus(oldStatus);
            statusDTO.setNewStatus(newStatus);
            statusDTO.setChangeReason("章节进度状态变更，完成率: " + completionRate + "%");
            statusDTO.setOperator("SYSTEM");
            statusHistoryService.saveStatusHistory(statusDTO);
        }

        return saved;
    }

    @Cacheable(value = "studentProgress", key = "'student:' + #studentId")
    public List<LearningProgress> getStudentProgressList(Long studentId) {
        return learningProgressRepository.findByStudentIdAndProgressType(studentId, ProgressType.COURSE.getCode());
    }

    @Cacheable(value = "warningProgress", key = "'threshold:' + #threshold")
    public List<LearningProgress> getWarningProgressList(Double threshold) {
        return learningProgressRepository.findByCompletionRateLessThanAndProgressType(threshold, ProgressType.COURSE.getCode());
    }

    @Transactional
    @CacheEvict(value = {"learningProgress", "studentProgress", "warningProgress"}, allEntries = true)
    public LearningProgress updateProgressStatus(Long progressId, String newStatus, String reason, String operator) {
        LearningProgress progress = learningProgressRepository.findById(progressId)
                .orElseThrow(() -> new RuntimeException("进度记录不存在: " + progressId));

        String oldStatus = progress.getStatus();
        progress.setStatus(newStatus);
        LearningProgress saved = learningProgressRepository.save(progress);

        StatusChangeDTO statusDTO = new StatusChangeDTO();
        statusDTO.setBusinessId(saved.getId());
        statusDTO.setBusinessType("LEARNING_PROGRESS");
        statusDTO.setOldStatus(oldStatus);
        statusDTO.setNewStatus(newStatus);
        statusDTO.setChangeReason(reason);
        statusDTO.setOperator(operator);
        statusHistoryService.saveStatusHistory(statusDTO);

        return saved;
    }
}
