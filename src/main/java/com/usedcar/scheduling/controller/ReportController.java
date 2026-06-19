package com.usedcar.scheduling.controller;

import com.usedcar.scheduling.dto.DashboardDTO;
import com.usedcar.scheduling.dto.ReportDTO;
import com.usedcar.scheduling.enums.UserRole;
import com.usedcar.scheduling.repository.StoreRepository;
import com.usedcar.scheduling.repository.UserRepository;
import com.usedcar.scheduling.service.ReportService;
import com.usedcar.scheduling.service.VehicleService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.time.LocalDate;

@Controller
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;
    private final StoreRepository storeRepository;
    private final UserRepository userRepository;
    private final VehicleService vehicleService;

    @GetMapping("/reports")
    public String index(@RequestParam(required = false) String type,
                        @RequestParam(required = false) LocalDate startDate,
                        @RequestParam(required = false) LocalDate endDate,
                        @RequestParam(required = false) Long storeId,
                        @RequestParam(required = false) Long personId,
                        Model model, HttpServletRequest request) {
        addCommonAttributes(model, request);
        model.addAttribute("stores", storeRepository.findAll());
        model.addAttribute("persons", userRepository.findAll());
        model.addAttribute("currentType", type);
        model.addAttribute("vehicles", vehicleService.findAll(PageRequest.of(0, 1000)));

        if (type != null) {
            ReportDTO report = switch (type) {
                case "inventory" -> reportService.getInventoryReport(startDate, endDate, storeId);
                case "date" -> reportService.getDateDrilldownReport(startDate, endDate);
                case "person" -> reportService.getPersonReport(startDate, endDate, personId);
                default -> null;
            };
            if (report != null) {
                model.addAttribute("report", report);
            }
        }
        return "report/index";
    }

    @PostMapping("/reports")
    public String indexPost(@RequestParam(required = false) String type,
                            @RequestParam(required = false) LocalDate startDate,
                            @RequestParam(required = false) LocalDate endDate,
                            @RequestParam(required = false) Long storeId,
                            @RequestParam(required = false) Long personId,
                            RedirectAttributes redirectAttributes) {
        StringBuilder redirectUrl = new StringBuilder("redirect:/reports");
        boolean hasParams = false;
        if (type != null) {
            redirectUrl.append(hasParams ? "&" : "?").append("type=").append(type);
            hasParams = true;
        }
        if (startDate != null) {
            redirectUrl.append(hasParams ? "&" : "?").append("startDate=").append(startDate);
            hasParams = true;
        }
        if (endDate != null) {
            redirectUrl.append(hasParams ? "&" : "?").append("endDate=").append(endDate);
            hasParams = true;
        }
        if (storeId != null) {
            redirectUrl.append(hasParams ? "&" : "?").append("storeId=").append(storeId);
            hasParams = true;
        }
        if (personId != null) {
            redirectUrl.append(hasParams ? "&" : "?").append("personId=").append(personId);
        }
        return redirectUrl.toString();
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
