package com.trial.booking.service;

import com.trial.booking.common.PageResult;
import com.trial.booking.entity.Appointment;
import com.trial.booking.entity.Teacher;
import com.trial.booking.entity.User;
import com.trial.booking.repository.AppointmentRepository;
import com.trial.booking.repository.TeacherRepository;
import com.trial.booking.repository.UserRepository;
import com.trial.booking.security.SecurityUtils;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StatisticsService {

    private final AppointmentRepository appointmentRepository;
    private final TeacherRepository teacherRepository;
    private final UserRepository userRepository;

    private static class RoleFilterContext {
        final String role;
        final Long userId;
        final Long teacherId;
        final String campus;

        RoleFilterContext(String role, Long userId, Long teacherId, String campus) {
            this.role = role;
            this.userId = userId;
            this.teacherId = teacherId;
            this.campus = campus;
        }
    }

    private RoleFilterContext getRoleFilterContext() {
        String role = SecurityUtils.getCurrentUserRole();
        Long userId = SecurityUtils.getCurrentUserId();
        if (role == null || userId == null) {
            return null;
        }
        switch (role) {
            case "TEACHER":
                Optional<Teacher> teacherOpt = teacherRepository.findByUserId(userId);
                if (teacherOpt.isEmpty()) {
                    return null;
                }
                return new RoleFilterContext(role, userId, teacherOpt.get().getId(), null);
            case "PRINCIPAL":
                Optional<User> userOpt = userRepository.findById(userId);
                if (userOpt.isEmpty() || userOpt.get().getCampus() == null) {
                    return null;
                }
                return new RoleFilterContext(role, userId, null, userOpt.get().getCampus());
            default:
                return new RoleFilterContext(role, userId, null, null);
        }
    }

    private void appendRoleFilter(List<Predicate> predicates, Root<Appointment> root, CriteriaBuilder cb, RoleFilterContext ctx) {
        switch (ctx.role) {
            case "STUDENT":
                predicates.add(cb.equal(root.get("studentUserId"), ctx.userId));
                break;
            case "PARENT":
                predicates.add(cb.equal(root.get("parentId"), ctx.userId));
                break;
            case "TEACHER":
                predicates.add(cb.equal(root.get("teacherId"), ctx.teacherId));
                break;
            case "PRINCIPAL":
                predicates.add(cb.equal(root.get("campus"), ctx.campus));
                break;
            case "ADMIN":
            case "RECEPTIONIST":
            default:
                break;
        }
    }

    public List<Map<String, Object>> getAttendanceRate(String dimension, String startDate, String endDate) {
        RoleFilterContext ctx = getRoleFilterContext();
        if (ctx == null) {
            return Collections.emptyList();
        }

        LocalDate start = LocalDate.parse(startDate);
        LocalDate end = LocalDate.parse(endDate);

        Specification<Appointment> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            appendRoleFilter(predicates, root, cb, ctx);
            predicates.add(cb.between(root.get("trialDate"), start, end));
            predicates.add(root.get("status").in("CONFIRMED", "COMPLETED"));
            return cb.and(predicates.toArray(new Predicate[0]));
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
        RoleFilterContext ctx = getRoleFilterContext();
        if (ctx == null) {
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("dates", new ArrayList<>());
            result.put("counts", new ArrayList<>());
            result.put("rates", new ArrayList<>());
            return result;
        }

        LocalDate start = LocalDate.parse(startDate);
        LocalDate end = LocalDate.parse(endDate);

        Specification<Appointment> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            appendRoleFilter(predicates, root, cb, ctx);
            predicates.add(cb.between(root.get("trialDate"), start, end));
            return cb.and(predicates.toArray(new Predicate[0]));
        };

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
        RoleFilterContext ctx = getRoleFilterContext();
        if (ctx == null) {
            return PageResult.of(Collections.emptyList(), 0, page, pageSize);
        }

        LocalDate start = LocalDate.parse(startDate);
        LocalDate end = LocalDate.parse(endDate);
        PageRequest pageable = PageRequest.of(page - 1, pageSize, Sort.by(Sort.Direction.DESC, "trialDate"));

        Specification<Appointment> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            appendRoleFilter(predicates, root, cb, ctx);
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
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Appointment> result = appointmentRepository.findAll(spec, pageable);
        return PageResult.of(result);
    }
}
