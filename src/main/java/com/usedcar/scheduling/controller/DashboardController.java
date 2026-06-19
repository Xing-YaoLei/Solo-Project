package com.usedcar.scheduling.controller;

import com.usedcar.scheduling.dto.DashboardDTO;
import com.usedcar.scheduling.enums.UserRole;
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
        UserRole userRole = getUserRole(request);
        Long currentUserId = getCurrentUserId(request);
        model.addAttribute("dashboardDTO", reportService.getDashboardData(null, userRole, currentUserId));
        return "dashboard";
    }

    @GetMapping("/api/dashboard")
    @ResponseBody
    public DashboardDTO dashboardApi(HttpServletRequest request) {
        UserRole userRole = getUserRole(request);
        Long currentUserId = getCurrentUserId(request);
        return reportService.getDashboardData(null, userRole, currentUserId);
    }

    private UserRole getUserRole(HttpServletRequest request) {
        String roleHeader = request.getHeader("X-User-Role");
        if (roleHeader != null) {
            try {
                return UserRole.valueOf(roleHeader);
            } catch (IllegalArgumentException e) {
                return UserRole.MANAGER;
            }
        }
        return UserRole.MANAGER;
    }

    private Long getCurrentUserId(HttpServletRequest request) {
        String userIdHeader = request.getHeader("X-User-Id");
        if (userIdHeader != null) {
            try {
                return Long.parseLong(userIdHeader);
            } catch (NumberFormatException e) {
                return 1L;
            }
        }
        return 1L;
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
