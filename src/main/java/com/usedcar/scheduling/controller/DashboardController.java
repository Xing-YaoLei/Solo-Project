package com.usedcar.scheduling.controller;

import com.usedcar.scheduling.dto.DashboardDTO;
import com.usedcar.scheduling.service.ReportService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
@RequiredArgsConstructor
public class DashboardController {

    private final ReportService reportService;

    @GetMapping("/")
    public String dashboard(Model model, HttpServletRequest request) {
        addCommonAttributes(model, request);
        model.addAttribute("dashboardDTO", reportService.getDashboardData(null));
        return "dashboard";
    }

    @GetMapping("/api/dashboard")
    @ResponseBody
    public DashboardDTO dashboardApi() {
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
