package com.training.renewal.service;

import com.training.renewal.entity.AcademicRecord;
import com.training.renewal.entity.ParentFeedback;
import com.training.renewal.entity.StudentEnrollment;
import com.training.renewal.repository.AcademicRecordRepository;
import com.training.renewal.repository.ParentFeedbackRepository;
import com.training.renewal.repository.StudentEnrollmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DataImportService {

    private final StudentEnrollmentRepository enrollmentRepository;
    private final AcademicRecordRepository academicRepository;
    private final ParentFeedbackRepository feedbackRepository;
    private final BatchService batchService;
    private final DashboardService dashboardService;

    @Transactional
    public Map<String, Integer> importEnrollmentData(List<StudentEnrollment> dataList,
                                                     String operatorId, String operatorName,
                                                     String remark) {
        String batchId = batchService.createBatch(
                "ENROLLMENT", "报名表导入",
                operatorId, operatorName, remark
        ).getBatchId();

        int successCount = 0;
        int failCount = 0;

        for (StudentEnrollment data : dataList) {
            try {
                data.setBatchId(batchId);
                data.setDataSource("ENROLLMENT_SYSTEM");

                StudentEnrollment existing = enrollmentRepository
                        .findByStudentNo(data.getStudentNo()).orElse(null);

                if (existing != null) {
                    data.setId(existing.getId());
                    data.setCreateTime(existing.getCreateTime());
                }

                enrollmentRepository.save(data);
                successCount++;
            } catch (Exception e) {
                failCount++;
            }
        }

        batchService.completeBatch(batchId, dataList.size(), successCount, failCount);
        dashboardService.evictDashboardCache();

        return Map.of("total", dataList.size(), "success", successCount, "fail", failCount);
    }

    @Transactional
    public Map<String, Integer> importAcademicData(List<AcademicRecord> dataList,
                                                   String operatorId, String operatorName,
                                                   String remark) {
        String batchId = batchService.createBatch(
                "ACADEMIC", "教务系统成绩导入",
                operatorId, operatorName, remark
        ).getBatchId();

        int successCount = 0;
        int failCount = 0;

        for (AcademicRecord data : dataList) {
            try {
                data.setBatchId(batchId);
                data.setDataSource("ACADEMIC_SYSTEM");
                academicRepository.save(data);
                successCount++;
            } catch (Exception e) {
                failCount++;
            }
        }

        updateStudentProgressFromAcademic(batchId);

        batchService.completeBatch(batchId, dataList.size(), successCount, failCount);
        dashboardService.evictDashboardCache();

        return Map.of("total", dataList.size(), "success", successCount, "fail", failCount);
    }

    @Transactional
    public Map<String, Integer> importFeedbackData(List<ParentFeedback> dataList,
                                                   String operatorId, String operatorName,
                                                   String remark) {
        String batchId = batchService.createBatch(
                "FEEDBACK", "家长群反馈导入",
                operatorId, operatorName, remark
        ).getBatchId();

        int successCount = 0;
        int failCount = 0;

        for (ParentFeedback data : dataList) {
            try {
                data.setBatchId(batchId);
                feedbackRepository.save(data);
                successCount++;
            } catch (Exception e) {
                failCount++;
            }
        }

        batchService.completeBatch(batchId, dataList.size(), successCount, failCount);
        dashboardService.evictDashboardCache();

        return Map.of("total", dataList.size(), "success", successCount, "fail", failCount);
    }

    @Transactional
    public void updateStudentProgressFromAcademic(String batchId) {
        List<AcademicRecord> records = academicRepository.findByBatchId(batchId);

        Map<String, List<AcademicRecord>> studentRecords = records.stream()
                .collect(Collectors.groupingBy(AcademicRecord::getStudentNo));

        for (Map.Entry<String, List<AcademicRecord>> entry : studentRecords.entrySet()) {
            String studentNo = entry.getKey();
            List<AcademicRecord> studentRecordList = entry.getValue();

            double avgProgress = studentRecordList.stream()
                    .mapToDouble(r -> r.getProgressRate() != null ? r.getProgressRate().doubleValue() : 0)
                    .average()
                    .orElse(0);

            double avgScore = studentRecordList.stream()
                    .mapToDouble(r -> r.getScore() != null ? r.getScore().doubleValue() : 0)
                    .average()
                    .orElse(0);

            enrollmentRepository.findByStudentNo(studentNo).ifPresent(student -> {
                student.setCompletionRate(BigDecimal.valueOf(avgProgress));
                enrollmentRepository.save(student);
            });
        }
    }

    public List<StudentEnrollment> mergeStudentData(List<String> studentNos) {
        List<StudentEnrollment> result = new ArrayList<>();

        for (String studentNo : studentNos) {
            enrollmentRepository.findByStudentNo(studentNo).ifPresent(student -> {
                List<AcademicRecord> academicRecords = academicRepository
                        .findByStudentNoOrderByExamDateDesc(studentNo);
                List<ParentFeedback> feedbacks = feedbackRepository
                        .findByStudentNoOrderByFeedbackTimeDesc(studentNo);

                result.add(student);
            });
        }

        return result;
    }
}
