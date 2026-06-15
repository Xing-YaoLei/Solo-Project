package com.trial.booking.service;

import com.trial.booking.common.PageResult;
import com.trial.booking.entity.Reminder;
import com.trial.booking.repository.ReminderRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReminderService {

    private final ReminderRepository reminderRepository;

    public PageResult<Reminder> search(int page, int pageSize, String status, String date) {
        PageRequest pageable = PageRequest.of(page - 1, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        Specification<Reminder> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null && !status.isEmpty()) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (date != null && !date.isEmpty()) {
                LocalDateTime dayStart = LocalDate.parse(date).atStartOfDay();
                LocalDateTime dayEnd = dayStart.plusDays(1);
                predicates.add(cb.between(root.get("createdAt"), dayStart, dayEnd));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Reminder> result = reminderRepository.findAll(spec, pageable);
        return PageResult.of(result);
    }

    public Reminder create(Reminder reminder) {
        return reminderRepository.save(reminder);
    }

    @Transactional
    public Reminder update(Long id, Reminder updated) {
        Reminder existing = reminderRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("提醒不存在"));
        existing.setAppointmentId(updated.getAppointmentId());
        existing.setStudentName(updated.getStudentName());
        existing.setStudentPhone(updated.getStudentPhone());
        existing.setSubject(updated.getSubject());
        existing.setType(updated.getType());
        existing.setContent(updated.getContent());
        return reminderRepository.save(existing);
    }

    @Transactional
    public Reminder send(Long id) {
        Reminder reminder = reminderRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("提醒不存在"));
        reminder.setStatus("SENT");
        reminder.setSentAt(LocalDateTime.now());
        return reminderRepository.save(reminder);
    }

    @Transactional
    public List<Reminder> batchSend(List<Long> ids) {
        return ids.stream().map(this::send).toList();
    }

    public void delete(Long id) {
        Reminder reminder = reminderRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("提醒不存在"));
        reminderRepository.delete(reminder);
    }
}
