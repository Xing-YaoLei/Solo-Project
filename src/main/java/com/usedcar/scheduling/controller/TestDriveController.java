package com.usedcar.scheduling.controller;

import com.usedcar.scheduling.domain.TestDriveRecord;
import com.usedcar.scheduling.service.TestDriveService;
import com.usedcar.scheduling.service.VehicleService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequiredArgsConstructor
public class TestDriveController {

    private final TestDriveService testDriveService;
    private final VehicleService vehicleService;

    @GetMapping("/test-drives")
    public String list(@RequestParam Long vehicleId, Model model, HttpServletRequest request) {
        addCommonAttributes(model, request);
        model.addAttribute("records",
                testDriveService.findByVehicleId(vehicleId).stream().map(testDriveService::toDTO).toList());
        model.addAttribute("vehicle", vehicleService.toDTO(vehicleService.findById(vehicleId)));
        return "testdrive/list";
    }

    @PostMapping("/test-drives")
    public String create(TestDriveRecord record, @RequestParam Long vehicleId) {
        testDriveService.create(record);
        return "redirect:/test-drives?vehicleId=" + vehicleId;
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
