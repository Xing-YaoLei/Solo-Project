package com.trial.booking.controller;

import com.trial.booking.common.ApiResponse;
import com.trial.booking.common.PageResult;
import com.trial.booking.entity.Reminder;
import com.trial.booking.security.SecurityUtils;
import com.trial.booking.service.ReminderService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reminders")
@RequiredArgsConstructor
public class ReminderController {

    private final ReminderService reminderService;

    @GetMapping
    public ApiResponse<PageResult<Reminder>> search(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String date) {
        return ApiResponse.success(reminderService.search(page, pageSize, status, date));
    }

    @PostMapping
    public ApiResponse<Reminder> create(@RequestBody Reminder reminder) {
        if (!SecurityUtils.hasAnyRole("ADMIN", "RECEPTIONIST", "PRINCIPAL")) {
            return ApiResponse.error(403, "无权限操作");
        }
        return ApiResponse.success(reminderService.create(reminder));
    }

    @PutMapping("/{id}")
    public ApiResponse<Reminder> update(
            @PathVariable Long id,
            @RequestBody Reminder reminder) {
        if (!SecurityUtils.hasAnyRole("ADMIN", "RECEPTIONIST", "PRINCIPAL")) {
            return ApiResponse.error(403, "无权限操作");
        }
        return ApiResponse.success(reminderService.update(id, reminder));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        if (!SecurityUtils.hasAnyRole("ADMIN", "RECEPTIONIST", "PRINCIPAL")) {
            return ApiResponse.error(403, "无权限操作");
        }
        reminderService.delete(id);
        return ApiResponse.success();
    }

    @PostMapping("/{id}/send")
    public ApiResponse<Reminder> send(@PathVariable Long id) {
        if (!SecurityUtils.hasAnyRole("ADMIN", "RECEPTIONIST", "PRINCIPAL")) {
            return ApiResponse.error(403, "无权限操作");
        }
        return ApiResponse.success(reminderService.send(id));
    }

    @PostMapping("/batch-send")
    public ApiResponse<List<Reminder>> batchSend(@RequestBody List<Long> ids) {
        if (!SecurityUtils.hasAnyRole("ADMIN", "RECEPTIONIST", "PRINCIPAL")) {
            return ApiResponse.error(403, "无权限操作");
        }
        return ApiResponse.success(reminderService.batchSend(ids));
    }
}
