package com.testdrive.service;

import com.testdrive.entity.Appointment;
import com.testdrive.entity.NoShowLog;
import com.testdrive.repository.AppointmentRepository;
import com.testdrive.repository.NoShowLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NoShowService {

    private final AppointmentRepository appointmentRepository;
    private final NoShowLogRepository noShowLogRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String NOSHOW_ALERT_PREFIX = "noshow:alert:";

    @Scheduled(cron = "0 30 18 * * ?")
    public void detectNoShowAppointments() {
        LocalDate today = LocalDate.now();
        List<Appointment> appointments = appointmentRepository.findByDateAndStatus(today, "CONFIRMED");

        for (Appointment apt : appointments) {
            if (apt.getActualDate() == null) {
                markAsNoShow(apt);
            }
        }
    }

    @Transactional
    public NoShowLog markAsNoShow(Appointment appointment) {
        appointment.setStatus("NO_SHOW");
        appointmentRepository.save(appointment);

        NoShowLog noShowLog = new NoShowLog();
        noShowLog.setAppointmentId(appointment.getId());
        noShowLog.setResponsiblePerson(appointment.getAssignedTo());
        noShowLog.setStatus("OPEN");
        noShowLog.setCreatedAt(LocalDateTime.now());
        noShowLog = noShowLogRepository.save(noShowLog);

        String alertKey = NOSHOW_ALERT_PREFIX + appointment.getAssignedTo();
        redisTemplate.opsForValue().set(alertKey, noShowLog.getId());

        log.warn("试驾爽约提醒: 预约ID={}, 负责人={}, 客户={}",
                appointment.getId(), appointment.getAssignedTo(), appointment.getCustomerName());

        return noShowLog;
    }

    @Transactional
    public NoShowLog handleNoShow(Long logId, String reason, String handleAction, String closedBy) {
        NoShowLog noShowLog = noShowLogRepository.findById(logId)
                .orElseThrow(() -> new RuntimeException("爽约记录不存在: " + logId));

        noShowLog.setReason(reason);
        noShowLog.setHandleAction(handleAction);
        noShowLog.setStatus("CLOSED");
        noShowLog.setClosedAt(LocalDateTime.now());
        noShowLog.setClosedBy(closedBy);

        String alertKey = NOSHOW_ALERT_PREFIX + noShowLog.getResponsiblePerson();
        redisTemplate.delete(alertKey);

        log.info("爽约处理完成: logId={}, 原因={}, 处理动作={}, 关闭人={}, 关闭时间={}",
                logId, reason, handleAction, closedBy, noShowLog.getClosedAt());

        return noShowLogRepository.save(noShowLog);
    }

    public List<NoShowLog> getOpenNoShows(String responsiblePerson) {
        if (responsiblePerson != null) {
            return noShowLogRepository.findByResponsiblePerson(responsiblePerson).stream()
                    .filter(l -> "OPEN".equals(l.getStatus()))
                    .toList();
        }
        return noShowLogRepository.findByStatus("OPEN");
    }

    public List<NoShowLog> getNoShowLogs(Long appointmentId) {
        return noShowLogRepository.findByAppointmentId(appointmentId).stream().toList();
    }

    public boolean hasAlert(String responsiblePerson) {
        String alertKey = NOSHOW_ALERT_PREFIX + responsiblePerson;
        return Boolean.TRUE.equals(redisTemplate.hasKey(alertKey));
    }
}
