package com.dealership.scheduler.controller;

import com.dealership.scheduler.entity.CustomerLead;
import com.dealership.scheduler.entity.SysUser;
import com.dealership.scheduler.entity.TestDriveAppointment;
import com.dealership.scheduler.entity.TestDriveFeedback;
import com.dealership.scheduler.entity.TestDriveRecord;
import com.dealership.scheduler.repository.CustomerLeadRepository;
import com.dealership.scheduler.repository.SysUserRepository;
import com.dealership.scheduler.service.TestDriveService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.List;
import java.util.Optional;

@Controller
@RequestMapping("/records")
public class RecordsController {

    @Autowired
    private TestDriveService testDriveService;

    @Autowired
    private CustomerLeadRepository leadRepository;

    @Autowired
    private SysUserRepository userRepository;

    @GetMapping
    public String list(Model model) {
        com.dealership.scheduler.dto.AppointmentQueryDTO query = new com.dealership.scheduler.dto.AppointmentQueryDTO();
        List<TestDriveAppointment> appointments = testDriveService.searchAppointments(query);
        for (TestDriveAppointment appt : appointments) {
            if (appt.getSalesConsultant() != null) {
                appt.getSalesConsultant().getRealName();
            }
            if (appt.getLead() != null) {
                appt.getLead().getCustomerName();
            }
        }
        model.addAttribute("appointments", appointments);
        return "records/list";
    }

    @GetMapping("/{appointmentId}")
    public String detail(@PathVariable Long appointmentId, Model model) {
        Optional<TestDriveAppointment> appointmentOpt = testDriveService.findAppointmentByIdWithDetails(appointmentId);
        if (appointmentOpt.isEmpty()) {
            return "redirect:/records";
        }
        TestDriveAppointment appointment = appointmentOpt.get();
        model.addAttribute("appointment", appointment);

        Optional<TestDriveRecord> record = testDriveService.findRecordByAppointmentIdWithDetails(appointmentId);
        model.addAttribute("record", record.orElse(null));

        Optional<TestDriveFeedback> feedback = testDriveService.findFeedbackByAppointmentIdWithDetails(appointmentId);
        model.addAttribute("feedback", feedback.orElse(null));

        return "records/detail";
    }

    @GetMapping("/{appointmentId}/record/new")
    public String newRecord(@PathVariable Long appointmentId, Model model) {
        TestDriveAppointment appointment = testDriveService.findAppointmentByIdWithDetails(appointmentId)
                .orElseThrow(() -> new RuntimeException("预约不存在"));

        TestDriveRecord record = new TestDriveRecord();
        record.setAppointment(appointment);
        record.setLead(appointment.getLead());
        record.setVehicleId(appointment.getVehicleId());
        record.setVehicleName(appointment.getVehicleName());

        model.addAttribute("record", record);
        model.addAttribute("drivers", userRepository.findByRole(SysUser.Role.SALES_CONSULTANT));
        return "records/record-form";
    }

    @PostMapping("/record/save")
    public String saveRecord(@ModelAttribute TestDriveRecord record,
                             @RequestParam(required = false) Long driverId,
                             RedirectAttributes redirectAttrs) {
        try {
            if (driverId != null) {
                userRepository.findById(driverId).ifPresent(record::setDriver);
            }
            if (record.getId() == null) {
                testDriveService.createRecord(record);
            } else {
                testDriveService.updateRecord(record);
            }
            redirectAttrs.addFlashAttribute("success", "试驾记录保存成功");
        } catch (Exception e) {
            redirectAttrs.addFlashAttribute("error", "保存失败: " + e.getMessage());
        }
        return "redirect:/records/" + record.getAppointment().getId();
    }

    @GetMapping("/{appointmentId}/record/edit")
    public String editRecord(@PathVariable Long appointmentId, Model model) {
        TestDriveRecord record = testDriveService.findRecordByAppointmentIdWithDetails(appointmentId)
                .orElse(new TestDriveRecord());
        model.addAttribute("record", record);
        model.addAttribute("drivers", userRepository.findByRole(SysUser.Role.SALES_CONSULTANT));
        return "records/record-form";
    }

    @GetMapping("/{appointmentId}/feedback/new")
    public String newFeedback(@PathVariable Long appointmentId, Model model) {
        TestDriveAppointment appointment = testDriveService.findAppointmentByIdWithDetails(appointmentId)
                .orElseThrow(() -> new RuntimeException("预约不存在"));

        TestDriveFeedback feedback = new TestDriveFeedback();
        feedback.setAppointment(appointment);
        feedback.setLead(appointment.getLead());
        feedback.setSalesConsultant(appointment.getSalesConsultant());
        feedback.setOverallRating(5);
        feedback.setVehicleComfortRating(5);
        feedback.setVehiclePerformanceRating(5);
        feedback.setSalesServiceRating(5);

        model.addAttribute("feedback", feedback);
        model.addAttribute("purchaseIntents", TestDriveFeedback.PurchaseIntent.values());
        return "records/feedback-form";
    }

    @PostMapping("/feedback/save")
    public String saveFeedback(@ModelAttribute TestDriveFeedback feedback,
                               RedirectAttributes redirectAttrs) {
        try {
            testDriveService.createFeedback(feedback);
            redirectAttrs.addFlashAttribute("success", "试驾反馈保存成功");
        } catch (Exception e) {
            redirectAttrs.addFlashAttribute("error", "保存失败: " + e.getMessage());
        }
        return "redirect:/records/" + feedback.getAppointment().getId();
    }

    @GetMapping("/lead/{leadId}")
    public String leadRecords(@PathVariable Long leadId, Model model) {
        Optional<CustomerLead> leadOpt = leadRepository.findByIdWithOwner(leadId);
        if (leadOpt.isEmpty()) {
            return "redirect:/records";
        }
        CustomerLead lead = leadOpt.get();
        model.addAttribute("lead", lead);

        List<TestDriveRecord> records = testDriveService.findRecordsByLeadIdWithDetails(leadId);
        model.addAttribute("records", records);

        List<TestDriveFeedback> feedbacks = testDriveService.findFeedbacksByLeadIdWithDetails(leadId);
        model.addAttribute("feedbacks", feedbacks);

        return "records/lead-records";
    }
}
