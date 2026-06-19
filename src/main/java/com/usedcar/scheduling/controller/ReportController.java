package com.usedcar.scheduling.controller;

import com.usedcar.scheduling.dto.DashboardDTO;
import com.usedcar.scheduling.dto.ReportDTO;
import com.usedcar.scheduling.enums.UserRole;
import com.usedcar.scheduling.repository.StoreRepository;
import com.usedcar.scheduling.repository.UserRepository;
import com.usedcar.scheduling.service.ReportService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@Controller
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;
    private final StoreRepository storeRepository;
    private final UserRepository userRepository;

    @GetMapping("/reports")
    public String index(Model model, HttpServletRequest request) {
        addCommonAttributes(model, request);
        model.addAttribute("stores", storeRepository.findAll());
        model.addAttribute("assessors", userRepository.findByRole(UserRole.ASSESSOR));
        model.addAttribute("salesList", userRepository.findByRole(UserRole.SALES));
        return "report/index";
    }

    @GetMapping("/reports/inventory")
    @ResponseBody
    public ReportDTO getInventoryReport(@RequestParam(required = false) LocalDate startDate,
                                        @RequestParam(required = false) LocalDate endDate,
                                        @RequestParam(required = false) Long storeId) {
        return reportService.getInventoryReport(startDate, endDate, storeId);
    }

    @GetMapping("/reports/person")
    @ResponseBody
    public ReportDTO getPersonReport(@RequestParam(required = false) LocalDate startDate,
                                     @RequestParam(required = false) LocalDate endDate,
                                     @RequestParam(required = false) Long personId) {
        return reportService.getPersonReport(startDate, endDate, personId);
    }

    @GetMapping("/reports/date")
    @ResponseBody
    public ReportDTO getDateDrilldownReport(@RequestParam(required = false) LocalDate startDate,
                                            @RequestParam(required = false) LocalDate endDate) {
        return reportService.getDateDrilldownReport(startDate, endDate);
    }

    @GetMapping("/reports/dashboard")
    @ResponseBody
    public DashboardDTO getDashboard() {
        return reportService.getDashboardData(null);
    }

    private void addCommonAttributes(Model model, HttpServletRequest request) {
        model.addAttribute("currentRole",
                request.getHeader("X-User-Role") != null ? request.getHeader("X-User-Role") : "MANAGER");
        model.addAttribute("currentUserName",
                request.getHeader("X-User-Name") != null ? request.getHeader("X-User-Name") : "管理员");
        model.addAttribute("currentUserId",
                request.getHeader("X-User-Id") != null ? Long.parseLong(request.getHeader("X-User-Id")) : 1L);
    }
}
