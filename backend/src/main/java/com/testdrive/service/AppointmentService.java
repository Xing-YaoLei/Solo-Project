package com.testdrive.service;

import com.testdrive.dto.AppointmentDispatchVO;
import com.testdrive.entity.Appointment;
import com.testdrive.entity.SalesFollowUp;
import com.testdrive.entity.TestDriveFeedback;
import com.testdrive.entity.Vehicle;
import com.testdrive.repository.AppointmentRepository;
import com.testdrive.repository.SalesFollowUpRepository;
import com.testdrive.repository.TestDriveFeedbackRepository;
import com.testdrive.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final VehicleRepository vehicleRepository;
    private final SalesFollowUpRepository salesFollowUpRepository;
    private final TestDriveFeedbackRepository feedbackRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String DISPATCH_CACHE_PREFIX = "dispatch:date:";

    public List<AppointmentDispatchVO> getDispatchBoard(LocalDate date) {
        String cacheKey = DISPATCH_CACHE_PREFIX + date.toString();
        @SuppressWarnings("unchecked")
        List<AppointmentDispatchVO> cached = (List<AppointmentDispatchVO>) redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return cached;
        }

        List<Appointment> appointments = appointmentRepository.findByAppointmentDateBetween(date, date);
        List<AppointmentDispatchVO> result = new ArrayList<>();

        for (Appointment apt : appointments) {
            AppointmentDispatchVO vo = new AppointmentDispatchVO();
            vo.setAppointmentId(apt.getId());
            vo.setVehicleId(apt.getVehicleId());
            vo.setCustomerName(apt.getCustomerName());
            vo.setCustomerPhone(apt.getCustomerPhone());
            vo.setAppointmentDate(apt.getAppointmentDate().toString());
            vo.setStartTime(apt.getStartTime().toString());
            vo.setEndTime(apt.getEndTime().toString());
            vo.setAppointmentStatus(apt.getStatus());
            vo.setAssignedTo(apt.getAssignedTo());

            vehicleRepository.findById(apt.getVehicleId()).ifPresent(v -> {
                vo.setVin(v.getVin());
                vo.setBrand(v.getBrand());
                vo.setModel(v.getModel());
                vo.setYear(v.getYear());
                vo.setColor(v.getColor());
                vo.setPrice(v.getPrice());
                vo.setVehicleStatus(v.getStatus());
                vo.setMileage(v.getMileage());
            });

            List<SalesFollowUp> follows = salesFollowUpRepository.findByAppointmentId(apt.getId());
            if (!follows.isEmpty()) {
                SalesFollowUp latest = follows.get(follows.size() - 1);
                vo.setLeadSource(latest.getLeadSource());
                vo.setLeadStatus(latest.getLeadStatus());
                vo.setSalesPerson(latest.getSalesPerson());
                vo.setFollowUpNote(latest.getFollowUpNote());
            }

            feedbackRepository.findByAppointmentId(apt.getId()).ifPresent(f -> {
                vo.setFeedbackId(f.getId());
                vo.setSatisfaction(f.getSatisfaction());
                vo.setPurchaseIntention(f.getPurchaseIntention());
            });

            result.add(vo);
        }

        redisTemplate.opsForValue().set(cacheKey, result, 5, TimeUnit.MINUTES);
        return result;
    }

    public Appointment createAppointment(Appointment appointment) {
        return appointmentRepository.save(appointment);
    }

    public Appointment updateAppointmentStatus(Long id, String status, String operator) {
        Appointment apt = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("预约不存在: " + id));
        apt.setStatus(status);
        apt.setUpdatedBy(operator);
        appointmentRepository.save(apt);
        String cacheKey = DISPATCH_CACHE_PREFIX + apt.getAppointmentDate().toString();
        redisTemplate.delete(cacheKey);
        return apt;
    }
}
