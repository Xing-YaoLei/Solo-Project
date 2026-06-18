package com.dealership.scheduler.service.impl;

import com.dealership.scheduler.entity.NoShowRecord;
import com.dealership.scheduler.entity.SysUser;
import com.dealership.scheduler.entity.TestDriveAppointment;
import com.dealership.scheduler.repository.NoShowRecordRepository;
import com.dealership.scheduler.repository.SysUserRepository;
import com.dealership.scheduler.repository.TestDriveAppointmentRepository;
import com.dealership.scheduler.service.NoShowService;
import com.dealership.scheduler.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class NoShowServiceImpl implements NoShowService {

    @Autowired
    private NoShowRecordRepository noShowRepository;

    @Autowired
    private TestDriveAppointmentRepository appointmentRepository;

    @Autowired
    private SysUserRepository userRepository;

    @Autowired
    private NotificationService notificationService;

    @Value("${app.no-show.notify-roles:SALES_MANAGER,STORE_MANAGER}")
    private String notifyRoles;

    @Override
    @Transactional
    public NoShowRecord createNoShow(Long appointmentId) {
        TestDriveAppointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("预约不存在"));

        Optional<NoShowRecord> existing = noShowRepository.findByAppointmentId(appointmentId);
        if (existing.isPresent()) {
            return existing.get();
        }

        NoShowRecord record = new NoShowRecord();
        record.setAppointment(appointment);
        record.setLead(appointment.getLead());
        record.setStatus(NoShowRecord.NoShowStatus.PENDING);
        NoShowRecord saved = noShowRepository.save(record);

        notificationService.createNoShowNotification(appointmentId,
                appointment.getCustomerName(), appointment.getVehicleName());

        return saved;
    }

    @Override
    @Transactional
    public NoShowRecord handleNoShow(Long id, Long handlerId, String actionTaken) {
        NoShowRecord record = noShowRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("爽约记录不存在"));
        record.setStatus(NoShowRecord.NoShowStatus.HANDLING);
        record.setActionTaken(actionTaken);
        if (handlerId != null) {
            userRepository.findById(handlerId).ifPresent(record::setHandler);
        }
        return noShowRepository.save(record);
    }

    @Override
    @Transactional
    public NoShowRecord updateReason(Long id, String reason) {
        NoShowRecord record = noShowRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("爽约记录不存在"));
        record.setReason(reason);
        return noShowRepository.save(record);
    }

    @Override
    @Transactional
    public NoShowRecord close(Long id, Long handlerId, String actionTaken) {
        NoShowRecord record = noShowRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("爽约记录不存在"));
        record.setStatus(NoShowRecord.NoShowStatus.CLOSED);
        record.setCloseTime(LocalDateTime.now());
        if (actionTaken != null) {
            record.setActionTaken(actionTaken);
        }
        if (handlerId != null) {
            userRepository.findById(handlerId).ifPresent(record::setHandler);
        }
        return noShowRepository.save(record);
    }

    @Override
    @Transactional
    public NoShowRecord reschedule(Long id, Long handlerId, Long newAppointmentId) {
        NoShowRecord record = noShowRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("爽约记录不存在"));
        record.setStatus(NoShowRecord.NoShowStatus.RESCHEDULED);
        record.setCloseTime(LocalDateTime.now());
        record.setActionTaken("已重新预约，新预约ID: " + newAppointmentId);
        if (handlerId != null) {
            userRepository.findById(handlerId).ifPresent(record::setHandler);
        }
        return noShowRepository.save(record);
    }

    @Override
    public Optional<NoShowRecord> findById(Long id) {
        return noShowRepository.findById(id);
    }

    @Override
    public Optional<NoShowRecord> findByAppointmentId(Long appointmentId) {
        return noShowRepository.findByAppointmentId(appointmentId);
    }

    @Override
    public List<NoShowRecord> findPending() {
        return noShowRepository.findByStatus(NoShowRecord.NoShowStatus.PENDING);
    }

    @Override
    public List<NoShowRecord> findAll() {
        return noShowRepository.findAll();
    }

    @Override
    @Transactional
    public void detectAndMarkNoShows() {
        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);

        List<TestDriveAppointment> appointments = appointmentRepository
                .findByStatusAndDateBefore(TestDriveAppointment.AppointmentStatus.SCHEDULED, today);

        appointments.addAll(appointmentRepository
                .findByStatusAndDateBefore(TestDriveAppointment.AppointmentStatus.CONFIRMED, today));

        List<SysUser.Role> roles = Arrays.stream(notifyRoles.split(","))
                .map(String::trim)
                .map(SysUser.Role::valueOf)
                .collect(Collectors.toList());

        for (TestDriveAppointment appt : appointments) {
            if (appt.getAppointmentDate().isBefore(yesterday) ||
                    (appt.getAppointmentDate().equals(yesterday) &&
                            appt.getAppointmentTime().isBefore(java.time.LocalTime.now()))) {
                if (appt.getStatus() == TestDriveAppointment.AppointmentStatus.SCHEDULED ||
                        appt.getStatus() == TestDriveAppointment.AppointmentStatus.CONFIRMED) {
                    appt.setStatus(TestDriveAppointment.AppointmentStatus.NO_SHOW);
                    appointmentRepository.save(appt);
                    createNoShow(appt.getId());
                }
            }
        }
    }
}
