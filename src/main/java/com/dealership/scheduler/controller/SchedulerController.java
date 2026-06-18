package com.dealership.scheduler.controller;

import com.dealership.scheduler.entity.CustomerLead;
import com.dealership.scheduler.entity.SysUser;
import com.dealership.scheduler.entity.TestDriveAppointment;
import com.dealership.scheduler.dto.AppointmentQueryDTO;
import com.dealership.scheduler.repository.CustomerLeadRepository;
import com.dealership.scheduler.repository.SysUserRepository;
import com.dealership.scheduler.service.TestDriveService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.time.LocalDate;
import java.util.List;

@Controller
@RequestMapping("/scheduler")
public class SchedulerController {

    @Autowired
    private TestDriveService testDriveService;

    @Autowired
    private CustomerLeadRepository leadRepository;

    @Autowired
    private SysUserRepository userRepository;

    @GetMapping
    public String scheduler(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                            Model model) {
        if (date == null) {
            date = LocalDate.now();
        }
        List<TestDriveAppointment> appointments = testDriveService.findAppointmentsByDate(date);
        model.addAttribute("appointments", appointments);
        model.addAttribute("currentDate", date);
        model.addAttribute("statuses", TestDriveAppointment.AppointmentStatus.values());
        return "scheduler/calendar";
    }

    @GetMapping("/new")
    public String newAppointment(@RequestParam(required = false) Long leadId, Model model) {
        TestDriveAppointment appointment = new TestDriveAppointment();
        if (leadId != null) {
            leadRepository.findById(leadId).ifPresent(lead -> {
                appointment.setLead(lead);
                appointment.setCustomerName(lead.getCustomerName());
                appointment.setCustomerPhone(lead.getPhone());
            });
        }
        model.addAttribute("appointment", appointment);
        model.addAttribute("leads", leadRepository.findAll());
        model.addAttribute("salesList", userRepository.findByRole(SysUser.Role.SALES_CONSULTANT));
        model.addAttribute("statuses", TestDriveAppointment.AppointmentStatus.values());
        return "scheduler/form";
    }

    @PostMapping("/save")
    public String saveAppointment(@ModelAttribute TestDriveAppointment appointment,
                                  @RequestParam(required = false) Long leadId,
                                  @RequestParam(required = false) Long salesId,
                                  RedirectAttributes redirectAttrs) {
        try {
            if (leadId != null) {
                leadRepository.findById(leadId).ifPresent(appointment::setLead);
            }
            if (salesId != null) {
                userRepository.findById(salesId).ifPresent(appointment::setSalesConsultant);
            }
            if (appointment.getId() == null) {
                testDriveService.createAppointment(appointment);
            } else {
                testDriveService.updateAppointment(appointment);
            }
            redirectAttrs.addFlashAttribute("success", "预约保存成功");
        } catch (Exception e) {
            redirectAttrs.addFlashAttribute("error", "保存失败: " + e.getMessage());
        }
        return "redirect:/scheduler";
    }

    @GetMapping("/edit/{id}")
    public String editAppointment(@PathVariable Long id, Model model) {
        testDriveService.findAppointmentById(id).ifPresent(appointment -> {
            model.addAttribute("appointment", appointment);
        });
        model.addAttribute("leads", leadRepository.findAll());
        model.addAttribute("salesList", userRepository.findByRole(SysUser.Role.SALES_CONSULTANT));
        model.addAttribute("statuses", TestDriveAppointment.AppointmentStatus.values());
        return "scheduler/form";
    }

    @GetMapping("/cancel/{id}")
    public String cancelAppointment(@PathVariable Long id, @RequestParam(required = false) String reason,
                                    RedirectAttributes redirectAttrs) {
        try {
            testDriveService.cancelAppointment(id, reason);
            redirectAttrs.addFlashAttribute("success", "预约已取消");
        } catch (Exception e) {
            redirectAttrs.addFlashAttribute("error", "取消失败: " + e.getMessage());
        }
        return "redirect:/scheduler";
    }

    @GetMapping("/complete/{id}")
    public String completeAppointment(@PathVariable Long id, RedirectAttributes redirectAttrs) {
        try {
            testDriveService.completeAppointment(id);
            redirectAttrs.addFlashAttribute("success", "预约已完成");
        } catch (Exception e) {
            redirectAttrs.addFlashAttribute("error", "操作失败: " + e.getMessage());
        }
        return "redirect:/scheduler";
    }

    @GetMapping("/no-show/{id}")
    public String markAsNoShow(@PathVariable Long id, RedirectAttributes redirectAttrs) {
        try {
            testDriveService.markAsNoShow(id);
            redirectAttrs.addFlashAttribute("success", "已标记为爽约");
        } catch (Exception e) {
            redirectAttrs.addFlashAttribute("error", "操作失败: " + e.getMessage());
        }
        return "redirect:/scheduler";
    }

    @GetMapping("/search")
    public String search(@ModelAttribute AppointmentQueryDTO query, Model model) {
        List<TestDriveAppointment> appointments = testDriveService.searchAppointments(query);
        model.addAttribute("appointments", appointments);
        model.addAttribute("query", query);
        model.addAttribute("salesList", userRepository.findAll());
        model.addAttribute("statuses", TestDriveAppointment.AppointmentStatus.values());
        return "scheduler/list";
    }
}
