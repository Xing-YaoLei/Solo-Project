package com.dealership.scheduler.service.impl;

import com.dealership.scheduler.entity.CustomerLead;
import com.dealership.scheduler.entity.TestDriveAppointment;
import com.dealership.scheduler.entity.TestDriveFeedback;
import com.dealership.scheduler.entity.TestDriveRecord;
import com.dealership.scheduler.dto.AppointmentQueryDTO;
import com.dealership.scheduler.repository.CustomerLeadRepository;
import com.dealership.scheduler.repository.TestDriveAppointmentRepository;
import com.dealership.scheduler.repository.TestDriveFeedbackRepository;
import com.dealership.scheduler.repository.TestDriveRecordRepository;
import com.dealership.scheduler.service.NoShowService;
import com.dealership.scheduler.service.TestDriveService;
import jakarta.persistence.criteria.Predicate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class TestDriveServiceImpl implements TestDriveService {

    @Autowired
    private TestDriveAppointmentRepository appointmentRepository;

    @Autowired
    private TestDriveRecordRepository recordRepository;

    @Autowired
    private TestDriveFeedbackRepository feedbackRepository;

    @Autowired
    private CustomerLeadRepository leadRepository;

    @Autowired
    private NoShowService noShowService;

    @Override
    @Transactional
    public TestDriveAppointment createAppointment(TestDriveAppointment appointment) {
        if (!isTimeSlotAvailable(appointment.getAppointmentDate(), appointment.getAppointmentTime(),
                appointment.getVehicleId(), null)) {
            throw new RuntimeException("该时段车辆已被预约");
        }
        TestDriveAppointment saved = appointmentRepository.save(appointment);
        if (saved.getLead() != null && saved.getLead().getId() != null) {
            CustomerLead lead = leadRepository.findById(saved.getLead().getId()).orElse(null);
            if (lead != null) {
                lead.setStatus(CustomerLead.LeadStatus.APPOINTED);
                leadRepository.save(lead);
            }
        }
        return saved;
    }

    @Override
    @Transactional
    public TestDriveAppointment updateAppointment(TestDriveAppointment appointment) {
        if (!isTimeSlotAvailable(appointment.getAppointmentDate(), appointment.getAppointmentTime(),
                appointment.getVehicleId(), appointment.getId())) {
            throw new RuntimeException("该时段车辆已被预约");
        }
        return appointmentRepository.save(appointment);
    }

    @Override
    public Optional<TestDriveAppointment> findAppointmentById(Long id) {
        return appointmentRepository.findById(id);
    }

    @Override
    public List<TestDriveAppointment> searchAppointments(AppointmentQueryDTO query) {
        Specification<TestDriveAppointment> spec = (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (query.getStartDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("appointmentDate"), query.getStartDate()));
            }
            if (query.getEndDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("appointmentDate"), query.getEndDate()));
            }
            if (StringUtils.hasText(query.getCustomerName())) {
                predicates.add(cb.like(root.get("customerName"), "%" + query.getCustomerName() + "%"));
            }
            if (StringUtils.hasText(query.getCustomerPhone())) {
                predicates.add(cb.like(root.get("customerPhone"), "%" + query.getCustomerPhone() + "%"));
            }
            if (query.getStatus() != null) {
                predicates.add(cb.equal(root.get("status"), query.getStatus()));
            }
            if (query.getSalesId() != null) {
                predicates.add(cb.equal(root.get("salesConsultant").get("id"), query.getSalesId()));
            }
            if (StringUtils.hasText(query.getVehicleId())) {
                predicates.add(cb.equal(root.get("vehicleId"), query.getVehicleId()));
            }
            cq.orderBy(cb.desc(root.get("appointmentDate")), cb.desc(root.get("appointmentTime")));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return appointmentRepository.findAll(spec);
    }

    @Override
    public List<TestDriveAppointment> findAppointmentsByDate(LocalDate date) {
        return appointmentRepository.findByAppointmentDate(date);
    }

    @Override
    @Transactional
    public TestDriveRecord createRecord(TestDriveRecord record) {
        TestDriveRecord saved = recordRepository.save(record);
        if (saved.getAppointment() != null) {
            TestDriveAppointment appt = appointmentRepository.findById(saved.getAppointment().getId()).orElse(null);
            if (appt != null) {
                appt.setStatus(TestDriveAppointment.AppointmentStatus.IN_PROGRESS);
                appointmentRepository.save(appt);
            }
        }
        return saved;
    }

    @Override
    @Transactional
    public TestDriveRecord updateRecord(TestDriveRecord record) {
        return recordRepository.save(record);
    }

    @Override
    public Optional<TestDriveRecord> findRecordByAppointmentId(Long appointmentId) {
        return recordRepository.findByAppointmentId(appointmentId);
    }

    @Override
    public List<TestDriveRecord> findRecordsByLeadId(Long leadId) {
        return recordRepository.findByLeadId(leadId);
    }

    @Override
    @Transactional
    public TestDriveFeedback createFeedback(TestDriveFeedback feedback) {
        TestDriveFeedback saved = feedbackRepository.save(feedback);
        if (saved.getLead() != null && saved.getLead().getId() != null) {
            CustomerLead lead = leadRepository.findById(saved.getLead().getId()).orElse(null);
            if (lead != null) {
                lead.setStatus(CustomerLead.LeadStatus.TEST_DRIVEN);
                leadRepository.save(lead);
            }
        }
        return saved;
    }

    @Override
    public Optional<TestDriveFeedback> findFeedbackByAppointmentId(Long appointmentId) {
        return feedbackRepository.findByAppointmentId(appointmentId);
    }

    @Override
    public List<TestDriveFeedback> findFeedbacksByLeadId(Long leadId) {
        return feedbackRepository.findByLeadId(leadId);
    }

    @Override
    @Transactional
    public void cancelAppointment(Long id, String reason) {
        TestDriveAppointment appt = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("预约不存在"));
        appt.setStatus(TestDriveAppointment.AppointmentStatus.CANCELLED);
        appointmentRepository.save(appt);
    }

    @Override
    @Transactional
    public void completeAppointment(Long id) {
        TestDriveAppointment appt = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("预约不存在"));
        appt.setStatus(TestDriveAppointment.AppointmentStatus.COMPLETED);
        appointmentRepository.save(appt);
    }

    @Override
    @Transactional
    public void markAsNoShow(Long appointmentId) {
        TestDriveAppointment appt = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("预约不存在"));
        appt.setStatus(TestDriveAppointment.AppointmentStatus.NO_SHOW);
        appointmentRepository.save(appt);
        noShowService.createNoShow(appointmentId);
    }

    @Override
    public boolean isTimeSlotAvailable(LocalDate date, LocalTime time, String vehicleId, Long excludeAppointmentId) {
        List<TestDriveAppointment> existing = appointmentRepository.findByDateAndVehicleId(date, vehicleId);
        for (TestDriveAppointment appt : existing) {
            if (excludeAppointmentId != null && appt.getId().equals(excludeAppointmentId)) {
                continue;
            }
            if (appt.getStatus() == TestDriveAppointment.AppointmentStatus.CANCELLED ||
                    appt.getStatus() == TestDriveAppointment.AppointmentStatus.NO_SHOW) {
                continue;
            }
            LocalTime startTime = appt.getAppointmentTime();
            LocalTime endTime = startTime.plusHours(1);
            LocalTime newEndTime = time.plusHours(1);
            if (time.isBefore(endTime) && newEndTime.isAfter(startTime)) {
                return false;
            }
        }
        return true;
    }
}
