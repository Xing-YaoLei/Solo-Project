package com.youth.training.job;

import com.youth.training.config.DashboardProperties;
import com.youth.training.dto.RenewalFollowDTO;
import com.youth.training.entity.LearningProgress;
import com.youth.training.entity.RenewalFollow;
import com.youth.training.entity.Student;
import com.youth.training.enums.CommonStatus;
import com.youth.training.enums.FollowStage;
import com.youth.training.enums.ProgressType;
import com.youth.training.repository.LearningProgressRepository;
import com.youth.training.repository.StudentRepository;
import com.youth.training.service.RenewalFollowService;
import lombok.extern.slf4j.Slf4j;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.quartz.QuartzJobBean;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Slf4j
public class RenewalReminderJob extends QuartzJobBean {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private RenewalFollowService renewalFollowService;

    @Autowired
    private DashboardProperties dashboardProperties;

    @Autowired
    private LearningProgressRepository learningProgressRepository;

    @Override
    protected void executeInternal(JobExecutionContext context) throws JobExecutionException {
        log.info("开始执行续费提醒任务");
        int studentCount = 0;
        int reminderCount = 0;
        try {
            Integer earlyWarningDays = dashboardProperties.getRenewal().getEarlyWarningDays();
            if (earlyWarningDays == null) {
                earlyWarningDays = 30;
            }

            LocalDate today = LocalDate.now();
            LocalDate warningDate = today.plusDays(earlyWarningDays);

            List<Student> expiringStudents = studentRepository.findByExpireDateBeforeAndStatus(
                    warningDate, CommonStatus.ACTIVE.getCode());
            studentCount = expiringStudents.size();

            for (Student student : expiringStudents) {
                List<RenewalFollow> followHistory = renewalFollowService.getStudentFollowHistory(
                        student.getId());
                boolean hasRecentFollow = false;
                if (!followHistory.isEmpty()) {
                    RenewalFollow lastFollow = followHistory.get(0);
                    if (lastFollow.getCreateTime() != null) {
                        LocalDate lastFollowDate = lastFollow.getCreateTime().toLocalDate();
                        if (!lastFollowDate.plusDays(7).isBefore(today)) {
                            hasRecentFollow = true;
                        }
                    }
                }

                if (!hasRecentFollow) {
                    long daysToExpire = ChronoUnit.DAYS.between(today, student.getExpireDate());
                    if (daysToExpire < 0) {
                        daysToExpire = 0;
                    }

                    String followStage;
                    if (daysToExpire > 21) {
                        followStage = FollowStage.EARLY.getCode();
                    } else if (daysToExpire >= 7) {
                        followStage = FollowStage.MIDDLE.getCode();
                    } else {
                        followStage = FollowStage.LATE.getCode();
                    }

                    double avgCompletionRate = calculateAvgCompletionRate(student.getId());

                    RenewalFollowDTO dto = new RenewalFollowDTO();
                    dto.setStudentId(student.getId());
                    dto.setFollowStage(followStage);
                    dto.setFollowTheme("系统续费提醒-距离到期还剩" + daysToExpire + "天");
                    dto.setFollowContent("学生" + student.getStudentName() + "课程将于"
                            + student.getExpireDate() + "到期，系统自动提醒，请及时跟进续费意向。当前完成率："
                            + String.format("%.2f", avgCompletionRate) + "%");
                    dto.setFollowMethod("SYSTEM");
                    dto.setPlanDate(today);
                    dto.setFollowPerson(student.getResponsibleTeacher());
                    dto.setStatus("PENDING");

                    renewalFollowService.createFollowRecord(dto);
                    reminderCount++;
                }
            }
            log.info("续费提醒任务执行完成，到期学生{}人，生成自动提醒{}条", studentCount, reminderCount);
        } catch (Exception e) {
            log.error("续费提醒任务执行异常", e);
            throw new JobExecutionException(e);
        }
    }

    private double calculateAvgCompletionRate(Long studentId) {
        List<LearningProgress> courseProgressList = learningProgressRepository
                .findByStudentIdAndProgressType(studentId, ProgressType.COURSE.getCode());
        if (courseProgressList.isEmpty()) {
            return 0.0;
        }
        double total = 0.0;
        for (LearningProgress progress : courseProgressList) {
            total += progress.getCompletionRate();
        }
        return Math.round((total / courseProgressList.size()) * 100.0) / 100.0;
    }
}
