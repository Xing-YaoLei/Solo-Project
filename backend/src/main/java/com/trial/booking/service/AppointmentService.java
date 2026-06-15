package com.trial.booking.service;

import com.trial.booking.common.PageResult;
import com.trial.booking.dto.AppointmentDTO;
import com.trial.booking.entity.Appointment;
import com.trial.booking.entity.ChangeLog;
import com.trial.booking.entity.Teacher;
import com.trial.booking.entity.User;
import com.trial.booking.repository.AppointmentRepository;
import com.trial.booking.repository.ChangeLogRepository;
import com.trial.booking.repository.TeacherRepository;
import com.trial.booking.repository.UserRepository;
import com.trial.booking.security.SecurityUtils;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final ChangeLogRepository changeLogRepository;
    private final TeacherRepository teacherRepository;
    private final UserRepository userRepository;

    @Transactional
    public Appointment create(AppointmentDTO.CreateRequest request) {
        Appointment appointment = new Appointment();
        appointment.setStudentName(request.getStudentName());
        appointment.setStudentPhone(request.getStudentPhone());
        appointment.setSubject(request.getSubject());
        appointment.setTrialDate(request.getTrialDate());
        appointment.setTimeSlot(request.getTimeSlot());
        appointment.setTeacherId(request.getTeacherId());
        appointment.setCampus(request.getCampus());
        appointment.setRemark(request.getRemark());
        appointment.setParentId(request.getParentId());
        appointment.setStudentUserId(request.getStudentUserId());

        List<Appointment> conflicts = detectConflictsInternal(
                request.getTeacherId(), request.getTrialDate(), request.getTimeSlot(), null);
        appointment.setStatus(conflicts.isEmpty() ? "PENDING" : "CONFLICT");

        Long currentUserId = SecurityUtils.getCurrentUserId();
        appointment.setCreatedBy(currentUserId);
        appointment.setUpdatedBy(currentUserId);

        Appointment saved = appointmentRepository.save(appointment);
        fillTeacherName(saved);
        return saved;
    }

    public PageResult<Appointment> search(AppointmentDTO.SearchParams params) {
        Specification<Appointment> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (params.getStartDate() != null && params.getEndDate() != null) {
                predicates.add(cb.between(root.get("trialDate"), params.getStartDate(), params.getEndDate()));
            } else if (params.getStartDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("trialDate"), params.getStartDate()));
            } else if (params.getEndDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("trialDate"), params.getEndDate()));
            }

            if (params.getCampus() != null && !params.getCampus().isEmpty()) {
                predicates.add(cb.equal(root.get("campus"), params.getCampus()));
            }
            if (params.getSubject() != null && !params.getSubject().isEmpty()) {
                predicates.add(cb.equal(root.get("subject"), params.getSubject()));
            }
            if (params.getStatus() != null && !params.getStatus().isEmpty()) {
                predicates.add(cb.equal(root.get("status"), params.getStatus()));
            }
            if (params.getTeacherId() != null) {
                predicates.add(cb.equal(root.get("teacherId"), params.getTeacherId()));
            }
            if (params.getKeyword() != null && !params.getKeyword().isEmpty()) {
                String like = "%" + params.getKeyword() + "%";
                predicates.add(cb.or(
                        cb.like(root.get("studentName"), like),
                        cb.like(root.get("studentPhone"), like),
                        cb.like(root.get("remark"), like)
                ));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Sort sort = Sort.by(Sort.Direction.DESC, "createdAt");
        Pageable pageable = PageRequest.of(params.getPage() - 1, params.getPageSize(), sort);
        Page<Appointment> page = appointmentRepository.findAll(spec, pageable);
        page.getContent().forEach(this::fillTeacherName);
        return PageResult.of(page);
    }

    public Appointment getById(Long id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("预约不存在"));
        fillTeacherName(appointment);
        return appointment;
    }

    @Transactional
    public Appointment update(Long id, AppointmentDTO.UpdateRequest request) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("预约不存在"));

        Long currentUserId = SecurityUtils.getCurrentUserId();
        String operatorName = getOperatorName(currentUserId);

        List<ChangeLog> logs = new ArrayList<>();

        if (request.getStudentName() != null && !request.getStudentName().equals(appointment.getStudentName())) {
            logs.add(buildChangeLog(appointment.getId(), "studentName",
                    appointment.getStudentName(), request.getStudentName(), "UPDATE", currentUserId, operatorName));
            appointment.setStudentName(request.getStudentName());
        }
        if (request.getStudentPhone() != null && !request.getStudentPhone().equals(appointment.getStudentPhone())) {
            logs.add(buildChangeLog(appointment.getId(), "studentPhone",
                    appointment.getStudentPhone(), request.getStudentPhone(), "UPDATE", currentUserId, operatorName));
            appointment.setStudentPhone(request.getStudentPhone());
        }
        if (request.getSubject() != null && !request.getSubject().equals(appointment.getSubject())) {
            logs.add(buildChangeLog(appointment.getId(), "subject",
                    appointment.getSubject(), request.getSubject(), "UPDATE", currentUserId, operatorName));
            appointment.setSubject(request.getSubject());
        }
        if (request.getTrialDate() != null && !request.getTrialDate().equals(appointment.getTrialDate())) {
            logs.add(buildChangeLog(appointment.getId(), "trialDate",
                    appointment.getTrialDate() != null ? appointment.getTrialDate().toString() : null,
                    request.getTrialDate().toString(), "UPDATE", currentUserId, operatorName));
            appointment.setTrialDate(request.getTrialDate());
        }
        if (request.getTimeSlot() != null && !request.getTimeSlot().equals(appointment.getTimeSlot())) {
            logs.add(buildChangeLog(appointment.getId(), "timeSlot",
                    appointment.getTimeSlot(), request.getTimeSlot(), "UPDATE", currentUserId, operatorName));
            appointment.setTimeSlot(request.getTimeSlot());
        }
        if (request.getTeacherId() != null && !request.getTeacherId().equals(appointment.getTeacherId())) {
            String oldTeacherName = getTeacherName(appointment.getTeacherId());
            String newTeacherName = getTeacherName(request.getTeacherId());
            ChangeLog teacherLog = buildChangeLog(appointment.getId(), "teacherId",
                    appointment.getTeacherId() != null ? appointment.getTeacherId().toString() : null,
                    request.getTeacherId().toString(), "UPDATE", currentUserId, operatorName);
            teacherLog.setOldTeacherName(oldTeacherName);
            teacherLog.setNewTeacherName(newTeacherName);
            logs.add(teacherLog);
            appointment.setTeacherId(request.getTeacherId());
        }
        if (request.getCampus() != null && !request.getCampus().equals(appointment.getCampus())) {
            logs.add(buildChangeLog(appointment.getId(), "campus",
                    appointment.getCampus(), request.getCampus(), "UPDATE", currentUserId, operatorName));
            appointment.setCampus(request.getCampus());
        }
        if (request.getStatus() != null && !request.getStatus().equals(appointment.getStatus())) {
            String changeType = "STATUS_CHANGE";
            if ("CONFIRMED".equals(request.getStatus())) changeType = "CONFIRM";
            else if ("CANCELLED".equals(request.getStatus())) changeType = "CANCEL";
            logs.add(buildChangeLog(appointment.getId(), "status",
                    appointment.getStatus(), request.getStatus(), changeType, currentUserId, operatorName));
            appointment.setStatus(request.getStatus());
        }
        if (request.getRemark() != null && !request.getRemark().equals(appointment.getRemark())) {
            logs.add(buildChangeLog(appointment.getId(), "remark",
                    appointment.getRemark(), request.getRemark(), "UPDATE", currentUserId, operatorName));
            appointment.setRemark(request.getRemark());
        }

        appointment.setUpdatedBy(currentUserId);
        changeLogRepository.saveAll(logs);

        Appointment saved = appointmentRepository.save(appointment);
        fillTeacherName(saved);
        return saved;
    }

    @Transactional
    public void delete(Long id) {
        if (!appointmentRepository.existsById(id)) {
            throw new jakarta.persistence.EntityNotFoundException("预约不存在");
        }
        appointmentRepository.deleteById(id);
    }

    @Transactional
    public Appointment reschedule(Long id, AppointmentDTO.RescheduleRequest request) {
        Appointment original = appointmentRepository.findById(id)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("预约不存在"));

        Long currentUserId = SecurityUtils.getCurrentUserId();
        String operatorName = getOperatorName(currentUserId);

        original.setStatus("RESCHEDULED");
        original.setUpdatedBy(currentUserId);
        appointmentRepository.save(original);

        Appointment newAppointment = new Appointment();
        newAppointment.setStudentName(original.getStudentName());
        newAppointment.setStudentPhone(original.getStudentPhone());
        newAppointment.setSubject(original.getSubject());
        newAppointment.setTrialDate(request.getNewDate());
        newAppointment.setTimeSlot(request.getNewTimeSlot());
        newAppointment.setTeacherId(request.getNewTeacherId() != null ? request.getNewTeacherId() : original.getTeacherId());
        newAppointment.setCampus(original.getCampus());
        newAppointment.setRemark(original.getRemark());
        newAppointment.setParentId(original.getParentId());
        newAppointment.setStudentUserId(original.getStudentUserId());

        if (original.getSourceOriginalId() != null) {
            newAppointment.setSourceOriginalId(original.getSourceOriginalId());
        } else {
            newAppointment.setSourceOriginalId(original.getId());
        }

        List<Appointment> conflicts = detectConflictsInternal(
                newAppointment.getTeacherId(), newAppointment.getTrialDate(),
                newAppointment.getTimeSlot(), null);
        newAppointment.setStatus(conflicts.isEmpty() ? "PENDING" : "CONFLICT");

        newAppointment.setCreatedBy(currentUserId);
        newAppointment.setUpdatedBy(currentUserId);
        Appointment savedNew = appointmentRepository.save(newAppointment);

        String oldTeacherName = getTeacherName(original.getTeacherId());
        String newTeacherName = getTeacherName(newAppointment.getTeacherId());

        ChangeLog changeLog = new ChangeLog();
        changeLog.setAppointmentId(original.getId());
        changeLog.setChangeType("RESCHEDULE");
        changeLog.setReason(request.getReason());
        changeLog.setSourceId(original.getId());
        changeLog.setNewAppointmentId(savedNew.getId());
        changeLog.setSourceOriginalId(newAppointment.getSourceOriginalId());

        changeLog.setOldStudentName(original.getStudentName());
        changeLog.setOldSubject(original.getSubject());
        changeLog.setOldTrialDate(original.getTrialDate() != null ? original.getTrialDate().toString() : null);
        changeLog.setOldTimeSlot(original.getTimeSlot());
        changeLog.setOldTeacherName(oldTeacherName);

        changeLog.setNewStudentName(newAppointment.getStudentName());
        changeLog.setNewSubject(newAppointment.getSubject());
        changeLog.setNewTrialDate(newAppointment.getTrialDate() != null ? newAppointment.getTrialDate().toString() : null);
        changeLog.setNewTimeSlot(newAppointment.getTimeSlot());
        changeLog.setNewTeacherName(newTeacherName);

        changeLog.setOperatorName(operatorName);
        changeLog.setOperatorId(currentUserId);

        changeLogRepository.save(changeLog);

        fillTeacherName(savedNew);
        return savedNew;
    }

    public List<Appointment> detectConflicts(AppointmentDTO.ConflictParams params) {
        List<Appointment> conflicts = detectConflictsInternal(
                params.getTeacherId(), params.getTrialDate(), params.getTimeSlot(), params.getExcludeId());
        conflicts.forEach(this::fillTeacherName);
        return conflicts;
    }

    @Transactional
    public void batchStatus(AppointmentDTO.BatchStatusRequest request) {
        List<Appointment> appointments = appointmentRepository.findByIdIn(request.getIds());
        Long currentUserId = SecurityUtils.getCurrentUserId();
        String operatorName = getOperatorName(currentUserId);

        List<ChangeLog> logs = new ArrayList<>();
        for (Appointment appointment : appointments) {
            if (!request.getStatus().equals(appointment.getStatus())) {
                logs.add(buildChangeLog(appointment.getId(), "status",
                        appointment.getStatus(), request.getStatus(), "BATCH_STATUS", currentUserId, operatorName));
                if (request.getReason() != null) {
                    logs.get(logs.size() - 1).setReason(request.getReason());
                }
                appointment.setStatus(request.getStatus());
                appointment.setUpdatedBy(currentUserId);
            }
        }

        changeLogRepository.saveAll(logs);
        appointmentRepository.saveAll(appointments);
    }

    @Transactional
    public List<Appointment> batchConfirm(AppointmentDTO.BatchIdsRequest request) {
        List<Appointment> appointments = appointmentRepository.findByIdIn(request.getIds());
        Long currentUserId = SecurityUtils.getCurrentUserId();
        String operatorName = getOperatorName(currentUserId);

        List<ChangeLog> logs = new ArrayList<>();
        for (Appointment appointment : appointments) {
            if (!"CONFIRMED".equals(appointment.getStatus())) {
                logs.add(buildChangeLog(appointment.getId(), "status",
                        appointment.getStatus(), "CONFIRMED", "BATCH_CONFIRM", currentUserId, operatorName));
                if (request.getReason() != null) {
                    logs.get(logs.size() - 1).setReason(request.getReason());
                }
                appointment.setStatus("CONFIRMED");
                appointment.setUpdatedBy(currentUserId);
            }
        }

        changeLogRepository.saveAll(logs);
        List<Appointment> saved = appointmentRepository.saveAll(appointments);
        saved.forEach(this::fillTeacherName);
        return saved;
    }

    @Transactional
    public List<Appointment> batchCancel(AppointmentDTO.BatchIdsRequest request) {
        List<Appointment> appointments = appointmentRepository.findByIdIn(request.getIds());
        Long currentUserId = SecurityUtils.getCurrentUserId();
        String operatorName = getOperatorName(currentUserId);

        List<ChangeLog> logs = new ArrayList<>();
        for (Appointment appointment : appointments) {
            if (!"CANCELLED".equals(appointment.getStatus())) {
                logs.add(buildChangeLog(appointment.getId(), "status",
                        appointment.getStatus(), "CANCELLED", "BATCH_CANCEL", currentUserId, operatorName));
                if (request.getReason() != null) {
                    logs.get(logs.size() - 1).setReason(request.getReason());
                }
                appointment.setStatus("CANCELLED");
                appointment.setUpdatedBy(currentUserId);
            }
        }

        changeLogRepository.saveAll(logs);
        List<Appointment> saved = appointmentRepository.saveAll(appointments);
        saved.forEach(this::fillTeacherName);
        return saved;
    }

    public List<ChangeLog> getChangeLog(Long appointmentId) {
        return changeLogRepository.findByAppointmentIdOrderByCreatedAtDesc(appointmentId);
    }

    public PageResult<ChangeLog> getAllChangeLogs(AppointmentDTO.ChangeLogSearchParams params) {
        Sort sort = Sort.by(Sort.Direction.DESC, "createdAt");
        Pageable pageable = PageRequest.of(params.getPage() - 1, params.getPageSize(), sort);

        Page<ChangeLog> page;
        if (params.getChangeType() != null && !params.getChangeType().isEmpty()) {
            page = changeLogRepository.findByChangeType(params.getChangeType(), pageable);
        } else {
            page = changeLogRepository.findAll(pageable);
        }
        return PageResult.of(page);
    }

    private List<Appointment> detectConflictsInternal(Long teacherId, LocalDate trialDate, String timeSlot, Long excludeId) {
        return appointmentRepository.findConflictingAppointments(teacherId, trialDate, timeSlot, excludeId);
    }

    private void fillTeacherName(Appointment appointment) {
        if (appointment != null && appointment.getTeacherId() != null) {
            appointment.setTeacherName(getTeacherName(appointment.getTeacherId()));
        }
    }

    private String getTeacherName(Long teacherId) {
        if (teacherId == null) return null;
        return teacherRepository.findById(teacherId)
                .map(Teacher::getName)
                .orElse(null);
    }

    private String getOperatorName(Long userId) {
        if (userId == null) return null;
        return userRepository.findById(userId)
                .map(User::getRealName)
                .orElse(null);
    }

    private ChangeLog buildChangeLog(Long appointmentId, String fieldName, String oldValue, String newValue,
                                     String changeType, Long operatorId, String operatorName) {
        ChangeLog log = new ChangeLog();
        log.setAppointmentId(appointmentId);
        log.setChangeType(changeType);
        log.setFieldName(fieldName);
        log.setOldValue(oldValue);
        log.setNewValue(newValue);
        log.setOperatorId(operatorId);
        log.setOperatorName(operatorName);
        return log;
    }
}
