package com.youth.training.service;

import com.youth.training.dto.StatusChangeDTO;
import com.youth.training.entity.Chapter;
import com.youth.training.entity.Course;
import com.youth.training.entity.Homework;
import com.youth.training.enums.CommonStatus;
import com.youth.training.repository.ChapterRepository;
import com.youth.training.repository.CourseRepository;
import com.youth.training.repository.HomeworkRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

@Service
public class CourseService {

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private ChapterRepository chapterRepository;

    @Autowired
    private HomeworkRepository homeworkRepository;

    @Autowired
    private StatusHistoryService statusHistoryService;

    @Transactional
    @CacheEvict(value = {"course", "courseList"}, allEntries = true)
    public Course createCourse(Course course) {
        course.setStatus(CommonStatus.ACTIVE.getCode());
        Course saved = courseRepository.save(course);

        StatusChangeDTO statusDTO = new StatusChangeDTO();
        statusDTO.setBusinessId(saved.getId());
        statusDTO.setBusinessType("COURSE");
        statusDTO.setOldStatus("");
        statusDTO.setNewStatus(saved.getStatus());
        statusDTO.setChangeReason("创建课程: " + saved.getCourseName());
        statusDTO.setOperator("SYSTEM");
        statusHistoryService.saveStatusHistory(statusDTO);

        return saved;
    }

    @Transactional
    @CacheEvict(value = {"course", "courseList"}, allEntries = true)
    public Course updateCourse(Long id, Course course) {
        Course existing = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("课程不存在: " + id));

        String oldStatus = existing.getStatus();

        existing.setCourseName(course.getCourseName());
        existing.setDescription(course.getDescription());
        existing.setSubject(course.getSubject());
        existing.setDifficultyLevel(course.getDifficultyLevel());
        if (course.getTotalChapters() != null) {
            existing.setTotalChapters(course.getTotalChapters());
        }
        if (course.getTotalHomeworks() != null) {
            existing.setTotalHomeworks(course.getTotalHomeworks());
        }
        if (course.getStatus() != null) {
            existing.setStatus(course.getStatus());
        }

        Course saved = courseRepository.save(existing);

        if (course.getStatus() != null && !Objects.equals(oldStatus, course.getStatus())) {
            StatusChangeDTO statusDTO = new StatusChangeDTO();
            statusDTO.setBusinessId(saved.getId());
            statusDTO.setBusinessType("COURSE");
            statusDTO.setOldStatus(oldStatus);
            statusDTO.setNewStatus(course.getStatus());
            statusDTO.setChangeReason("更新课程状态");
            statusDTO.setOperator("SYSTEM");
            statusHistoryService.saveStatusHistory(statusDTO);
        }

        return saved;
    }

    @Transactional
    @CacheEvict(value = {"course", "courseList"}, allEntries = true)
    public Course deleteCourse(Long id) {
        Course existing = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("课程不存在: " + id));

        String oldStatus = existing.getStatus();
        existing.setStatus(CommonStatus.DELETED.getCode());
        Course saved = courseRepository.save(existing);

        StatusChangeDTO statusDTO = new StatusChangeDTO();
        statusDTO.setBusinessId(saved.getId());
        statusDTO.setBusinessType("COURSE");
        statusDTO.setOldStatus(oldStatus);
        statusDTO.setNewStatus(CommonStatus.DELETED.getCode());
        statusDTO.setChangeReason("删除课程");
        statusDTO.setOperator("SYSTEM");
        statusHistoryService.saveStatusHistory(statusDTO);

        return saved;
    }

    @Cacheable(value = "course", key = "#id")
    public Course getCourse(Long id) {
        return courseRepository.findById(id).orElse(null);
    }

    @Cacheable(value = "courseList", key = "'status:' + (#status != null ? #status : 'all')")
    public List<Course> listCourses(String status) {
        if (status != null && !status.isEmpty()) {
            return courseRepository.findByStatus(status);
        }
        return courseRepository.findAll();
    }

    public List<Chapter> getChaptersByCourse(Long courseId) {
        return chapterRepository.findByCourseIdOrderBySortOrderAsc(courseId);
    }

    public List<Homework> getHomeworkByCourse(Long courseId) {
        return homeworkRepository.findByCourseIdOrderBySortOrderAsc(courseId);
    }

    @Transactional
    @CacheEvict(value = {"course", "courseList"}, allEntries = true)
    public Course recalculateCourseStats(Long courseId) {
        Course existing = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("课程不存在: " + courseId));

        int actualChapters = chapterRepository.countByCourseId(courseId);
        int actualHomeworks = homeworkRepository.countByCourseId(courseId);

        existing.setTotalChapters(actualChapters);
        existing.setTotalHomeworks(actualHomeworks);

        return courseRepository.save(existing);
    }
}
