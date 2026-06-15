package com.trial.booking.service;

import com.trial.booking.entity.Appointment;
import com.trial.booking.entity.AttendanceRecord;
import com.trial.booking.repository.AppointmentRepository;
import com.trial.booking.repository.AttendanceRecordRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceRecordRepository attendanceRecordRepository;
    private final AppointmentRepository appointmentRepository;

    @Transactional
    public AttendanceRecord checkIn(Long appointmentId, String status, Long operatorId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new EntityNotFoundException("预约不存在"));
        appointment.setAttendanceStatus(status);
        appointment.setCheckInTime(LocalDateTime.now());
        appointmentRepository.save(appointment);

        AttendanceRecord record = new AttendanceRecord();
        record.setAppointmentId(appointmentId);
        record.setStatus(status);
        record.setCheckInTime(LocalDateTime.now());
        record.setOperatorId(operatorId);
        return attendanceRecordRepository.save(record);
    }

    @Transactional
    public List<AttendanceRecord> batchCheckIn(List<Long> ids, String status, Long operatorId) {
        return ids.stream()
                .map(id -> checkIn(id, status, operatorId))
                .toList();
    }

    public Map<String, Object> getAttendanceRate(String startDate, String endDate, String campus) {
        LocalDate start = LocalDate.parse(startDate);
        LocalDate end = LocalDate.parse(endDate);
        long total = appointmentRepository.countConfirmedByDateRange(start, end, campus);
        long checkedIn = appointmentRepository.countByAttendanceStatusAndDateRange("CHECKED_IN", start, end, campus);
        long late = appointmentRepository.countByAttendanceStatusAndDateRange("LATE", start, end, campus);
        long noShow = appointmentRepository.countByAttendanceStatusAndDateRange("NO_SHOW", start, end, campus);
        double rate = total > 0 ? (double) (checkedIn + late) / total * 100 : 0;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("total", total);
        result.put("checkedIn", checkedIn);
        result.put("late", late);
        result.put("noShow", noShow);
        result.put("rate", Math.round(rate * 100.0) / 100.0);
        return result;
    }
}
