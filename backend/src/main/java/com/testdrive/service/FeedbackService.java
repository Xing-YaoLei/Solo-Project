package com.testdrive.service;

import com.testdrive.dto.FeedbackUpdateDTO;
import com.testdrive.entity.FeedbackChangeLog;
import com.testdrive.entity.TestDriveFeedback;
import com.testdrive.repository.FeedbackChangeLogRepository;
import com.testdrive.repository.TestDriveFeedbackRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FeedbackService {

    private final TestDriveFeedbackRepository feedbackRepository;
    private final FeedbackChangeLogRepository changeLogRepository;

    private static final List<String> AUDITABLE_FIELDS = List.of(
            "satisfaction", "customerOpinion", "purchaseIntention", "internalNote"
    );

    @Transactional
    public TestDriveFeedback updateFeedback(FeedbackUpdateDTO dto) {
        TestDriveFeedback feedback = feedbackRepository.findById(dto.getFeedbackId())
                .orElseThrow(() -> new RuntimeException("反馈不存在: " + dto.getFeedbackId()));

        List<FeedbackChangeLog> changeLogs = new ArrayList<>();

        if (dto.getSatisfaction() != null && !dto.getSatisfaction().equals(feedback.getSatisfaction())) {
            changeLogs.add(buildChangeLog(feedback.getId(), "satisfaction",
                    feedback.getSatisfaction(), dto.getSatisfaction(), dto.getOperator()));
            feedback.setSatisfaction(dto.getSatisfaction());
        }
        if (dto.getCustomerOpinion() != null && !dto.getCustomerOpinion().equals(feedback.getCustomerOpinion())) {
            changeLogs.add(buildChangeLog(feedback.getId(), "customerOpinion",
                    feedback.getCustomerOpinion(), dto.getCustomerOpinion(), dto.getOperator()));
            feedback.setCustomerOpinion(dto.getCustomerOpinion());
        }
        if (dto.getPurchaseIntention() != null && !dto.getPurchaseIntention().equals(feedback.getPurchaseIntention())) {
            changeLogs.add(buildChangeLog(feedback.getId(), "purchaseIntention",
                    feedback.getPurchaseIntention(), dto.getPurchaseIntention(), dto.getOperator()));
            feedback.setPurchaseIntention(dto.getPurchaseIntention());
        }
        if (dto.getInternalNote() != null && !dto.getInternalNote().equals(feedback.getInternalNote())) {
            changeLogs.add(buildChangeLog(feedback.getId(), "internalNote",
                    feedback.getInternalNote(), dto.getInternalNote(), dto.getOperator()));
            feedback.setInternalNote(dto.getInternalNote());
        }

        if (!changeLogs.isEmpty()) {
            changeLogRepository.saveAll(changeLogs);
            feedback.setVersion(feedback.getVersion() + 1);
        }

        feedback.setUpdatedBy(dto.getOperator());
        feedback.setUpdatedAt(LocalDateTime.now());
        return feedbackRepository.save(feedback);
    }

    public List<FeedbackChangeLog> getChangeLogs(Long feedbackId) {
        return changeLogRepository.findByFeedbackIdOrderByChangedAtDesc(feedbackId);
    }

    public TestDriveFeedback getFeedback(Long id) {
        return feedbackRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("反馈不存在: " + id));
    }

    public TestDriveFeedback createFeedback(TestDriveFeedback feedback) {
        feedback.setVersion(1);
        feedback.setFilledAt(LocalDateTime.now());
        return feedbackRepository.save(feedback);
    }

    private FeedbackChangeLog buildChangeLog(Long feedbackId, String fieldName,
                                              String oldValue, String newValue, String operator) {
        FeedbackChangeLog log = new FeedbackChangeLog();
        log.setFeedbackId(feedbackId);
        log.setFieldName(fieldName);
        log.setOldValue(oldValue);
        log.setNewValue(newValue);
        log.setChangedBy(operator);
        log.setChangedAt(LocalDateTime.now());
        return log;
    }
}
