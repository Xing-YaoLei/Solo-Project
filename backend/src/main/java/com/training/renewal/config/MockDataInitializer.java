package com.training.renewal.config;

import com.training.renewal.entity.*;
import com.training.renewal.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class MockDataInitializer implements CommandLineRunner {

    private final StudentEnrollmentRepository enrollmentRepository;
    private final AcademicRecordRepository academicRepository;
    private final ParentFeedbackRepository feedbackRepository;
    private final ProgressCommentRepository commentRepository;
    private final ImportBatchRepository batchRepository;

    private final Random random = new Random();

    @Override
    public void run(String... args) {
        if (enrollmentRepository.count() > 0) {
            log.info("数据库已有数据，跳过模拟数据初始化");
            return;
        }

        log.info("开始初始化模拟数据...");

        String enrollmentBatchId = createBatch("ENROLLMENT", "初始报名表导入");
        String academicBatchId = createBatch("ACADEMIC", "初始成绩导入");
        String feedbackBatchId = createBatch("FEEDBACK", "初始反馈导入");

        List<StudentEnrollment> students = generateStudents(enrollmentBatchId);
        enrollmentRepository.saveAll(students);

        List<AcademicRecord> academicRecords = generateAcademicRecords(students, academicBatchId);
        academicRepository.saveAll(academicRecords);

        List<ParentFeedback> feedbacks = generateFeedbacks(students, feedbackBatchId);
        feedbackRepository.saveAll(feedbacks);

        List<ProgressComment> comments = generateComments(students);
        commentRepository.saveAll(comments);

        log.info("模拟数据初始化完成: 学生{}人, 成绩{}条, 反馈{}条, 注释{}条",
                students.size(), academicRecords.size(), feedbacks.size(), comments.size());
    }

    private String createBatch(String type, String name) {
        ImportBatch batch = new ImportBatch();
        batch.setBatchId(type + "_INIT_" + System.currentTimeMillis());
        batch.setBatchType(type);
        batch.setBatchName(name);
        batch.setBatchTime(LocalDateTime.now());
        batch.setStatus("COMPLETED");
        batch.setOperatorId("system");
        batch.setOperatorName("系统初始化");
        batch.setActualSyncTime(LocalDateTime.now());
        batch.setIsDelayed(false);
        batchRepository.save(batch);
        return batch.getBatchId();
    }

    private List<StudentEnrollment> generateStudents(String batchId) {
        List<StudentEnrollment> students = new ArrayList<>();
        String[] grades = {"初一", "初二", "初三", "高一", "高二", "高三"};
        String[][] courses = {
            {"数学提高班", "数学"},
            {"英语强化班", "英语"},
            {"物理冲刺班", "物理"},
            {"化学基础班", "化学"},
            {"语文写作班", "语文"}
        };
        String[] consultants = {
            "C001,张老师", "C002,李老师", "C003,王老师", "C004,赵老师", "C005,刘老师"
        };
        String[] statuses = {"已续费", "跟进中", "待跟进", "已流失"};

        for (int i = 1; i <= 200; i++) {
            StudentEnrollment student = new StudentEnrollment();
            student.setBatchId(batchId);
            student.setStudentNo("S" + String.format("%04d", i));
            student.setStudentName("学员" + i);
            student.setGrade(grades[i % grades.length]);

            String[] course = courses[i % courses.length];
            student.setCourseName(course[0]);
            student.setCourseTag(course[1]);

            student.setEnrollDate(LocalDate.now().minusMonths(random.nextInt(12) + 1));
            student.setExpireDate(LocalDate.now().plusDays(random.nextInt(180) + 30));
            student.setTotalFee(BigDecimal.valueOf(random.nextInt(5000) + 2000));
            student.setPaidFee(student.getTotalFee());

            String[] consultant = consultants[i % consultants.length].split(",");
            student.setConsultantId(consultant[0]);
            student.setConsultantName(consultant[1]);

            double rate = 40 + random.nextDouble() * 55;
            student.setCompletionRate(BigDecimal.valueOf(rate).setScale(2, BigDecimal.ROUND_HALF_UP));

            student.setRenewalStatus(statuses[i % statuses.length]);
            student.setIsDeleted(false);
            student.setDataSource("ENROLLMENT_SYSTEM");

            students.add(student);
        }

        return students;
    }

    private List<AcademicRecord> generateAcademicRecords(List<StudentEnrollment> students, String batchId) {
        List<AcademicRecord> records = new ArrayList<>();
        String[] examNames = {"入学测试", "第一次月考", "期中考试", "第二次月考", "期末考试"};
        String[] levels = {"优秀", "良好", "中等", "及格", "待提高"};

        for (StudentEnrollment student : students) {
            for (int i = 0; i < 3; i++) {
                AcademicRecord record = new AcademicRecord();
                record.setBatchId(batchId);
                record.setStudentNo(student.getStudentNo());
                record.setCourseName(student.getCourseName());
                record.setCourseTag(student.getCourseTag());
                record.setExamDate(LocalDate.now().minusMonths(i * 2));
                record.setExamName(examNames[i % examNames.length]);

                double score = 50 + random.nextDouble() * 50;
                record.setScore(BigDecimal.valueOf(score).setScale(2, BigDecimal.ROUND_HALF_UP));
                record.setClassRank(BigDecimal.valueOf(random.nextInt(30) + 1));
                record.setGradeRank(BigDecimal.valueOf(random.nextInt(200) + 1));

                double progress = 30 + random.nextDouble() * 65;
                record.setProgressRate(BigDecimal.valueOf(progress).setScale(2, BigDecimal.ROUND_HALF_UP));

                record.setLevel(levels[random.nextInt(levels.length)]);
                record.setTeacherComment("继续努力，保持良好的学习状态。");
                record.setDataSource("ACADEMIC_SYSTEM");

                records.add(record);
            }
        }

        return records;
    }

    private List<ParentFeedback> generateFeedbacks(List<StudentEnrollment> students, String batchId) {
        List<ParentFeedback> feedbacks = new ArrayList<>();
        String[] types = {"课程咨询", "学习反馈", "投诉建议", "续费咨询", "其他"};
        String[] channels = {"微信群", "电话", "面谈", "APP消息", "公众号"};
        String[] sentiments = {"POSITIVE", "NEUTRAL", "NEGATIVE"};
        String[] statuses = {"PENDING", "PROCESSING", "RESOLVED"};

        for (int i = 0; i < 60; i++) {
            StudentEnrollment student = students.get(i % students.size());

            ParentFeedback feedback = new ParentFeedback();
            feedback.setBatchId(batchId);
            feedback.setStudentNo(student.getStudentNo());
            feedback.setParentName(student.getStudentName() + "家长");
            feedback.setFeedbackType(types[i % types.length]);
            feedback.setFeedbackChannel(channels[i % channels.length]);

            String sentiment = sentiments[i % sentiments.length];
            feedback.setSentiment(sentiment);
            feedback.setScore(sentiment.equals("POSITIVE") ? 5 :
                              sentiment.equals("NEUTRAL") ? 3 : 1);

            feedback.setContent(generateFeedbackContent(sentiment));
            feedback.setFeedbackTime(LocalDateTime.now().minusDays(random.nextInt(30)));
            feedback.setHandleStatus(statuses[i % statuses.length]);
            feedback.setHandlerId("C00" + (i % 5 + 1));
            feedback.setHandlerName("处理老师" + (i % 5 + 1));
            feedback.setHandleResult("已跟进处理，家长表示满意。");

            feedbacks.add(feedback);
        }

        return feedbacks;
    }

    private String generateFeedbackContent(String sentiment) {
        if ("POSITIVE".equals(sentiment)) {
            return "孩子最近学习进步很大，感谢老师的悉心教导，课程安排很合理。";
        } else if ("NEUTRAL".equals(sentiment)) {
            return "想了解一下下学期的课程安排，以及是否有新的优惠活动。";
        } else {
            return "最近感觉孩子学习状态不太好，作业完成质量下降，希望老师能多关注一下。";
        }
    }

    private List<ProgressComment> generateComments(List<StudentEnrollment> students) {
        List<ProgressComment> comments = new ArrayList<>();
        String[] types = {"LOW_PROGRESS", "PARENT_FEEDBACK", "RENEWAL_FOLLOWUP", "OTHER"};
        String[] riskLevels = {"LOW", "MEDIUM", "HIGH"};

        List<StudentEnrollment> lowProgressStudents = students.stream()
                .filter(s -> s.getCompletionRate().compareTo(BigDecimal.valueOf(60)) < 0)
                .limit(15)
                .toList();

        for (int i = 0; i < lowProgressStudents.size(); i++) {
            StudentEnrollment student = lowProgressStudents.get(i);

            ProgressComment comment = new ProgressComment();
            comment.setStudentNo(student.getStudentNo());
            comment.setStudentName(student.getStudentName());
            comment.setConsultantId(student.getConsultantId());
            comment.setConsultantName(student.getConsultantName());
            comment.setCommentType(types[i % types.length]);
            comment.setRiskLevel(riskLevels[i % riskLevels.length]);
            comment.setContent("学习进度落后，需要加强监督。近期作业完成率下降明显，已与家长沟通。");
            comment.setFollowUpPlan("下周安排一对一辅导，制定学习计划");
            comment.setFollowUpTime(LocalDateTime.now().plusDays(random.nextInt(7) + 1));
            comment.setStatus(i % 3 == 0 ? "COMPLETED" : "PENDING");

            comments.add(comment);
        }

        return comments;
    }
}
