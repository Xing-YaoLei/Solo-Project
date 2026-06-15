package com.trial.booking.service;

import com.trial.booking.common.PageResult;
import com.trial.booking.entity.Appointment;
import com.trial.booking.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StatisticsService {

    private final AppointmentRepository appointmentRepository;

    public List<Map<String, Object>> getAttendanceRate(String dimension, String startDate, String endDate) {
        LocalDate start = LocalDate.parse(startDate);
        LocalDate end = LocalDate.parse(endDate);

        Specification<Appointment> spec = (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            predicates.add(cb.between(root.get("trialDate"), start, end));
            predicates.add(root.get("status").in("CONFIRMED", "COMPLETED"));
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        List<Appointment> appointments = appointmentRepository.findAll(spec);

        Map<String, List<Appointment>> grouped = appointments.stream()
                .collect(Collectors.groupingBy(a -> {
                    switch (dimension) {
                        case "teacher": return String.valueOf(a.getTeacherId());
                        case "subject": return a.getSubject();
                        default: return a.getCampus();
                    }
                }));

        return grouped.entrySet().stream().map(entry -> {
            List<Appointment> list = entry.getValue();
            long total = list.size();
            long checkedIn = list.stream().filter(a -> "CHECKED_IN".equals(a.getAttendanceStatus())).count();
            long late = list.stream().filter(a -> "LATE".equals(a.getAttendanceStatus())).count();
            long noShow = list.stream().filter(a -> "NO_SHOW".equals(a.getAttendanceStatus())).count();
            double rate = total > 0 ? (double) (checkedIn + late) / total * 100 : 0;

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("name", entry.getKey());
            item.put("total", total);
            item.put("checkedIn", checkedIn);
            item.put("late", late);
            item.put("noShow", noShow);
            item.put("rate", Math.round(rate * 100.0) / 100.0);
            return item;
        }).collect(Collectors.toList());
    }

    public Map<String, Object> getTrend(String startDate, String endDate) {
        LocalDate start = LocalDate.parse(startDate);
        LocalDate end = LocalDate.parse(endDate);

        Specification<Appointment> spec = (root, query, cb) ->
                cb.between(root.get("trialDate"), start, end);

        List<Appointment> appointments = appointmentRepository.findAll(spec);

        Map<LocalDate, List<Appointment>> byDate = appointments.stream()
                .collect(Collectors.groupingBy(Appointment::getTrialDate));

        List<String> dates = new ArrayList<>();
        List<Long> counts = new ArrayList<>();
        List<Double> rates = new ArrayList<>();

        for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
            dates.add(d.toString());
            List<Appointment> dayAppts = byDate.getOrDefault(d, List.of());
            counts.add((long) dayAppts.size());
            long checkedCount = dayAppts.stream()
                    .filter(a -> "CHECKED_IN".equals(a.getAttendanceStatus()) || "LATE".equals(a.getAttendanceStatus()))
                    .count();
            double dayRate = dayAppts.isEmpty() ? 0.0 : (double) checkedCount / dayAppts.size() * 100;
            rates.add(Math.round(dayRate * 100.0) / 100.0);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("dates", dates);
        result.put("counts", counts);
        result.put("rates", rates);
        return result;
    }

    public PageResult<Appointment> drillDown(String dimension, String dimensionValue,
                                              String startDate, String endDate, int page, int pageSize) {
        LocalDate start = LocalDate.parse(startDate);
        LocalDate end = LocalDate.parse(endDate);
        PageRequest pageable = PageRequest.of(page - 1, pageSize, Sort.by(Sort.Direction.DESC, "trialDate"));

        Specification<Appointment> spec = (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            predicates.add(cb.between(root.get("trialDate"), start, end));
            switch (dimension) {
                case "campus":
                    predicates.add(cb.equal(root.get("campus"), dimensionValue));
                    break;
                case "teacher":
                    predicates.add(cb.equal(root.get("teacherId"), Long.valueOf(dimensionValue)));
                    break;
                case "subject":
                    predicates.add(cb.equal(root.get("subject"), dimensionValue));
                    break;
            }
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        Page<Appointment> result = appointmentRepository.findAll(spec, pageable);
        return PageResult.of(result);
    }
}
