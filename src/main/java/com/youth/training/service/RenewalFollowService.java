package com.youth.training.service;

import com.youth.training.dto.RenewalFollowDTO;
import com.youth.training.dto.StatusChangeDTO;
import com.youth.training.entity.RenewalFollow;
import com.youth.training.entity.Student;
import com.youth.training.enums.CommonStatus;
import com.youth.training.repository.RenewalFollowRepository;
import com.youth.training.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
public class RenewalFollowService {

    @Autowired
    private RenewalFollowRepository renewalFollowRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private StatusHistoryService statusHistoryService;

    private static final String PENDING_STATUS = "PENDING";
    private static final String COMPLETED_STATUS = "COMPLETED";

    private final AtomicInteger followSequence = new AtomicInteger(0);

    @Transactional
    @CacheEvict(value = {"renewalFollow", "studentFollowHistory", "todayFollowList", "upcomingRenewals"}, allEntries = true)
    public RenewalFollow createFollowRecord(RenewalFollowDTO dto) {
        RenewalFollow follow = new RenewalFollow();
        follow.setFollowNo(generateFollowNo());
        follow.setStudentId(dto.getStudentId());
        follow.setFollowStage(dto.getFollowStage());
        follow.setFollowTheme(dto.getFollowTheme());
        follow.setFollowContent(dto.getFollowContent());
        follow.setFollowMethod(dto.getFollowMethod());
        follow.setPlanDate(dto.getPlanDate());
        follow.setActualDate(dto.getActualDate());
        follow.setFollowPerson(dto.getFollowPerson());
        follow.setStudentFeedback(dto.getStudentFeedback());
        follow.setParentFeedback(dto.getParentFeedback());
        follow.setRenewalIntention(dto.getRenewalIntention());
        follow.setRenewalStatus(dto.getRenewalStatus());
        follow.setNextStep(dto.getNextStep());
        follow.setNextFollowDate(dto.getNextFollowDate());
        follow.setStatus(dto.getStatus() != null ? dto.getStatus() : PENDING_STATUS);
        follow.setRemark(dto.getRemark());

        RenewalFollow saved = renewalFollowRepository.save(follow);

        StatusChangeDTO statusDTO = new StatusChangeDTO();
        statusDTO.setBusinessId(saved.getId());
        statusDTO.setBusinessType("RENEWAL_FOLLOW");
        statusDTO.setOldStatus("");
        statusDTO.setNewStatus(saved.getStatus());
        statusDTO.setChangeReason("创建续费跟进记录: " + dto.getFollowTheme());
        statusDTO.setOperator(dto.getFollowPerson() != null ? dto.getFollowPerson() : "SYSTEM");
        statusHistoryService.saveStatusHistory(statusDTO);

        return saved;
    }

    @Cacheable(value = "studentFollowHistory", key = "'student:' + #studentId")
    public List<RenewalFollow> getStudentFollowHistory(Long studentId) {
        return renewalFollowRepository.findByStudentIdOrderByCreateTimeDesc(studentId);
    }

    @Cacheable(value = "todayFollowList", key = "'person:' + #followPerson")
    public List<RenewalFollow> getTodayFollowList(String followPerson) {
        LocalDate today = LocalDate.now();
        List<RenewalFollow> all = renewalFollowRepository.findByFollowPersonOrderByPlanDateAsc(followPerson);
        return all.stream()
                .filter(f -> today.equals(f.getPlanDate()))
                .filter(f -> PENDING_STATUS.equals(f.getStatus()))
                .collect(Collectors.toList());
    }

    @Cacheable(value = "upcomingRenewals", key = "'days:' + #days")
    public List<Map<String, Object>> getUpcomingRenewals(Integer days) {
        LocalDate today = LocalDate.now();
        LocalDate endDate = today.plusDays(days);

        List<Student> expiringStudents = studentRepository.findByExpireDateBetweenAndStatus(today, endDate, CommonStatus.ACTIVE.getCode());

        List<Map<String, Object>> result = new ArrayList<>();
        for (Student student : expiringStudents) {
            Map<String, Object> item = new HashMap<>();
            item.put("student", student);
            List<RenewalFollow> follows = renewalFollowRepository.findByStudentIdOrderByCreateTimeDesc(student.getId());
            item.put("followRecords", follows);
            if (!follows.isEmpty()) {
                item.put("lastFollowTime", follows.get(0).getCreateTime());
                item.put("lastFollowStatus", follows.get(0).getStatus());
                item.put("lastRenewalIntention", follows.get(0).getRenewalIntention());
            }
            result.add(item);
        }
        return result;
    }

    @Transactional
    @CacheEvict(value = {"renewalFollow", "studentFollowHistory", "todayFollowList", "upcomingRenewals"}, allEntries = true)
    public RenewalFollow updateFollowStatus(Long followId, String newStatus, String renewalStatus, String reason, String operator) {
        RenewalFollow follow = renewalFollowRepository.findById(followId)
                .orElseThrow(() -> new RuntimeException("跟进记录不存在: " + followId));

        String oldStatus = follow.getStatus();
        String oldRenewalStatus = follow.getRenewalStatus();

        follow.setStatus(newStatus);
        if (renewalStatus != null) {
            follow.setRenewalStatus(renewalStatus);
        }
        if (COMPLETED_STATUS.equals(newStatus) && follow.getActualDate() == null) {
            follow.setActualDate(LocalDate.now());
        }

        RenewalFollow saved = renewalFollowRepository.save(follow);

        if (!Objects.equals(oldStatus, newStatus) || !Objects.equals(oldRenewalStatus, renewalStatus)) {
            StatusChangeDTO statusDTO = new StatusChangeDTO();
            statusDTO.setBusinessId(saved.getId());
            statusDTO.setBusinessType("RENEWAL_FOLLOW");
            statusDTO.setOldStatus(oldStatus + (oldRenewalStatus != null ? "/" + oldRenewalStatus : ""));
            statusDTO.setNewStatus(newStatus + (renewalStatus != null ? "/" + renewalStatus : ""));
            statusDTO.setChangeReason(reason);
            statusDTO.setOperator(operator);
            statusHistoryService.saveStatusHistory(statusDTO);
        }

        return saved;
    }

    private synchronized String generateFollowNo() {
        String dateStr = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        int seq = followSequence.incrementAndGet();
        if (seq > 999999) {
            followSequence.set(1);
            seq = 1;
        }
        return "FLW" + dateStr + String.format("%06d", seq);
    }
}
