package com.youth.training.job;

import com.youth.training.config.DashboardProperties;
import com.youth.training.dto.ExceptionOrderDTO;
import com.youth.training.entity.Course;
import com.youth.training.entity.LearningProgress;
import com.youth.training.entity.Student;
import com.youth.training.enums.CommonStatus;
import com.youth.training.enums.ExceptionType;
import com.youth.training.enums.PriorityLevel;
import com.youth.training.enums.ProgressType;
import com.youth.training.repository.CourseRepository;
import com.youth.training.repository.LearningProgressRepository;
import com.youth.training.repository.StudentRepository;
import com.youth.training.service.ExceptionOrderService;
import com.youth.training.service.LearningProgressService;
import lombok.extern.slf4j.Slf4j;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.quartz.QuartzJobBean;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Slf4j
public class ProgressCheckJob extends QuartzJobBean {

    @Autowired
    private LearningProgressService learningProgressService;

    @Autowired
    private ExceptionOrderService exceptionOrderService;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private DashboardProperties dashboardProperties;

    @Autowired
    private LearningProgressRepository learningProgressRepository;

    @Override
    protected void executeInternal(JobExecutionContext context) throws JobExecutionException {
        log.info("开始执行进度检测任务");
        int studentCount = 0;
        int exceptionCount = 0;
        try {
            Double warningThreshold = dashboardProperties.getProgress().getWarningThreshold();
            if (warningThreshold == null) {
                warningThreshold = 60.0;
            }

            List<Student> activeStudents = studentRepository.findByStatus(CommonStatus.ACTIVE.getCode());
            List<Course> activeCourses = courseRepository.findByStatus(CommonStatus.ACTIVE.getCode());
            studentCount = activeStudents.size();

            for (Student student : activeStudents) {
                for (Course course : activeCourses) {
                    Optional<LearningProgress> existingProgress = learningProgressRepository
                            .findByStudentIdAndCourseIdAndProgressType(
                                    student.getId(), course.getId(), ProgressType.COURSE.getCode());
                    LocalDateTime originalLastStudyTime = null;
                    if (existingProgress.isPresent()) {
                        originalLastStudyTime = existingProgress.get().getLastStudyTime();
                    }

                    LearningProgress progress = learningProgressService.calculateCourseProgress(
                            student.getId(), course.getId());
                    double completionRate = progress.getCompletionRate();

                    if (completionRate < warningThreshold) {
                        boolean noStudyFor7Days = originalLastStudyTime == null
                                || originalLastStudyTime.plusDays(7).isBefore(LocalDateTime.now());

                        if (noStudyFor7Days) {
                            boolean existsActive = exceptionOrderService.existsActiveException(
                                    student.getId(), ExceptionType.PROGRESS_DELAY.getCode());
                            if (!existsActive) {
                                ExceptionOrderDTO dto = new ExceptionOrderDTO();
                                dto.setExceptionType(ExceptionType.PROGRESS_DELAY.getCode());
                                String priority = completionRate < 30.0
                                        ? PriorityLevel.URGENT.getCode()
                                        : PriorityLevel.HIGH.getCode();
                                dto.setPriority(priority);
                                dto.setTitle("【进度异常】" + student.getStudentName() + "-"
                                        + course.getCourseName() + " 学习进度落后");
                                dto.setDescription("学生" + student.getStudentName() + "的"
                                        + course.getCourseName() + "课程完成率仅为"
                                        + String.format("%.2f", completionRate) + "%，低于阈值"
                                        + String.format("%.0f", warningThreshold) + "%，请及时跟进。");
                                dto.setImpactScope("影响课程学习进度，可能导致到期前无法完成全部章节，影响续费转化");
                                dto.setResponsiblePerson(student.getResponsibleTeacher());
                                dto.setHandlingDepartment("教学部");
                                dto.setCompletionRateBefore(completionRate);
                                dto.setStudentId(student.getId());
                                dto.setCourseId(course.getId());
                                dto.setCreatedBy("SYSTEM");

                                exceptionOrderService.createExceptionOrder(dto);
                                exceptionCount++;
                            }
                        }
                    }
                }
            }
            log.info("进度检测任务执行完成，共检查学生{}人，生成异常单{}张", studentCount, exceptionCount);
        } catch (Exception e) {
            log.error("进度检测任务执行异常", e);
            throw new JobExecutionException(e);
        }
    }
}
