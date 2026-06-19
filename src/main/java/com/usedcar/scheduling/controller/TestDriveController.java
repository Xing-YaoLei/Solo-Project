package com.usedcar.scheduling.controller;

import com.usedcar.scheduling.domain.TestDriveRecord;
import com.usedcar.scheduling.domain.User;
import com.usedcar.scheduling.domain.Vehicle;
import com.usedcar.scheduling.repository.UserRepository;
import com.usedcar.scheduling.service.TestDriveService;
import com.usedcar.scheduling.service.VehicleService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequiredArgsConstructor
public class TestDriveController {

    private final TestDriveService testDriveService;
    private final VehicleService vehicleService;
    private final UserRepository userRepository;

    @GetMapping("/test-drives")
    public String list(@RequestParam(required = false) Long vehicleId,
                       @RequestParam(defaultValue = "0") int page,
                       @RequestParam(defaultValue = "20") int size,
                       Model model, HttpServletRequest request) {
        addCommonAttributes(model, request);
        if (vehicleId == null) {
            Page<?> records = testDriveService.findAll(PageRequest.of(page, size))
                    .map(testDriveService::toDTO);
            model.addAttribute("records", records);
            model.addAttribute("vehicles", vehicleService.findAll(PageRequest.of(0, 1000)).getContent());
            model.addAttribute("selectedVehicleId", null);
        } else {
            model.addAttribute("records",
                    testDriveService.findByVehicleId(vehicleId).stream().map(testDriveService::toDTO).toList());
            model.addAttribute("vehicle", vehicleService.toDTO(vehicleService.findById(vehicleId)));
            model.addAttribute("selectedVehicleId", vehicleId);
        }
        return "testdrive/list";
    }

    @PostMapping("/test-drives")
    public String create(TestDriveRecord record,
                         @RequestParam(defaultValue = "0") Long vehicleId,
                         @RequestParam(defaultValue = "1") Long operatorId,
                         HttpServletRequest request,
                         RedirectAttributes redirectAttributes) {
        if (vehicleId == 0) {
            redirectAttributes.addFlashAttribute("error", "请选择车辆");
            return "redirect:/test-drives";
        }
        Long currentUserId = request.getHeader("X-User-Id") != null ? Long.parseLong(request.getHeader("X-User-Id")) : 1L;
        User sales = userRepository.findById(currentUserId).orElse(null);
        Vehicle vehicle = vehicleService.findById(vehicleId);
        record.setSales(sales);
        record.setVehicle(vehicle);
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
