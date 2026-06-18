package com.dealership.scheduler.controller;

import com.dealership.scheduler.entity.NoShowRecord;
import com.dealership.scheduler.entity.Notification;
import com.dealership.scheduler.entity.SysUser;
import com.dealership.scheduler.repository.SysUserRepository;
import com.dealership.scheduler.service.NoShowService;
import com.dealership.scheduler.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.List;
import java.util.Optional;

@Controller
@RequestMapping("/no-show")
public class NoShowController {

    @Autowired
    private NoShowService noShowService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private SysUserRepository userRepository;

    private static final Long DEFAULT_OPERATOR_ID = 1L;

    @GetMapping
    public String list(Model model) {
        List<NoShowRecord> records = noShowService.findAllWithDetails();
        model.addAttribute("records", records);
        model.addAttribute("statuses", NoShowRecord.NoShowStatus.values());
        return "no-show/list";
    }

    @GetMapping("/pending")
    public String pending(Model model) {
        List<NoShowRecord> records = noShowService.findPendingWithDetails();
        model.addAttribute("records", records);
        model.addAttribute("statuses", NoShowRecord.NoShowStatus.values());
        return "no-show/list";
    }

    @GetMapping("/{id}")
    public String detail(@PathVariable Long id, Model model) {
        Optional<NoShowRecord> recordOpt = noShowService.findByIdWithDetails(id);
        if (recordOpt.isEmpty()) {
            return "redirect:/no-show";
        }
        model.addAttribute("record", recordOpt.get());
        model.addAttribute("statuses", NoShowRecord.NoShowStatus.values());
        model.addAttribute("handlers", userRepository.findByEnabledTrue());
        return "no-show/detail";
    }

    @PostMapping("/{id}/reason")
    public String updateReason(@PathVariable Long id, @RequestParam String reason,
                               RedirectAttributes redirectAttrs) {
        try {
            noShowService.updateReason(id, reason);
            redirectAttrs.addFlashAttribute("success", "原因已更新");
        } catch (Exception e) {
            redirectAttrs.addFlashAttribute("error", "更新失败: " + e.getMessage());
        }
        return "redirect:/no-show/" + id;
    }

    @PostMapping("/{id}/handle")
    public String handleNoShow(@PathVariable Long id, @RequestParam String actionTaken,
                               @RequestParam(required = false) Long handlerId,
                               RedirectAttributes redirectAttrs) {
        try {
            if (handlerId == null) {
                handlerId = DEFAULT_OPERATOR_ID;
            }
            noShowService.handleNoShow(id, handlerId, actionTaken);
            redirectAttrs.addFlashAttribute("success", "已标记为处理中");
        } catch (Exception e) {
            redirectAttrs.addFlashAttribute("error", "操作失败: " + e.getMessage());
        }
        return "redirect:/no-show/" + id;
    }

    @PostMapping("/{id}/close")
    public String closeNoShow(@PathVariable Long id, @RequestParam String actionTaken,
                              @RequestParam(required = false) Long handlerId,
                              RedirectAttributes redirectAttrs) {
        try {
            if (handlerId == null) {
                handlerId = DEFAULT_OPERATOR_ID;
            }
            noShowService.close(id, handlerId, actionTaken);
            redirectAttrs.addFlashAttribute("success", "爽约记录已关闭");
        } catch (Exception e) {
            redirectAttrs.addFlashAttribute("error", "关闭失败: " + e.getMessage());
        }
        return "redirect:/no-show/" + id;
    }

    @PostMapping("/{id}/reschedule")
    public String reschedule(@PathVariable Long id, @RequestParam Long newAppointmentId,
                             @RequestParam(required = false) Long handlerId,
                             RedirectAttributes redirectAttrs) {
        try {
            if (handlerId == null) {
                handlerId = DEFAULT_OPERATOR_ID;
            }
            noShowService.reschedule(id, handlerId, newAppointmentId);
            redirectAttrs.addFlashAttribute("success", "已重新预约");
        } catch (Exception e) {
            redirectAttrs.addFlashAttribute("error", "操作失败: " + e.getMessage());
        }
        return "redirect:/no-show/" + id;
    }

    @GetMapping("/notifications")
    public String notifications(Model model) {
        List<Notification> notifications = notificationService.getUserNotifications(
                DEFAULT_OPERATOR_ID, SysUser.Role.STORE_MANAGER);
        model.addAttribute("notifications", notifications);
        return "no-show/notifications";
    }

    @PostMapping("/notifications/{id}/read")
    public String markNotificationRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return "redirect:/no-show/notifications";
    }
}
