package com.usedcar.scheduling.controller;

import com.usedcar.scheduling.enums.PreparationStatus;
import com.usedcar.scheduling.service.PreparationService;
import com.usedcar.scheduling.service.VehicleService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequiredArgsConstructor
public class PreparationController {

    private final PreparationService preparationService;
    private final VehicleService vehicleService;

    @GetMapping("/preparations")
    public String list(@RequestParam(required = false) Long vehicleId,
                       @RequestParam(defaultValue = "0") int page,
                       @RequestParam(defaultValue = "20") int size,
                       Model model, HttpServletRequest request) {
        addCommonAttributes(model, request);
        if (vehicleId == null) {
            Page<?> preparations = preparationService.findAll(PageRequest.of(page, size))
                    .map(preparationService::toDTO);
            model.addAttribute("preparations", preparations);
            model.addAttribute("vehicles", vehicleService.findAll(PageRequest.of(0, 1000)).getContent());
            model.addAttribute("selectedVehicleId", null);
        } else {
            model.addAttribute("preparations",
                    preparationService.findByVehicleId(vehicleId).stream().map(preparationService::toDTO).toList());
            model.addAttribute("vehicle", vehicleService.toDTO(vehicleService.findById(vehicleId)));
            model.addAttribute("selectedVehicleId", vehicleId);
        }
        return "preparation/list";
    }

    @PostMapping("/preparations/{id}/status")
    public String updateStatus(@PathVariable Long id,
                               @RequestParam(required = false) Long vehicleId,
                               @RequestParam PreparationStatus status,
                               @RequestParam(defaultValue = "1") Long operatorId,
                               @RequestParam(required = false) String remark) {
        preparationService.updateItemStatus(id, status, operatorId, remark);
        return "redirect:/preparations" + (vehicleId != null ? "?vehicleId=" + vehicleId : "");
    }

    @PostMapping("/preparations/init")
    public String initChecklist(@RequestParam Long vehicleId, @RequestParam(defaultValue = "1") Long operatorId) {
        preparationService.initPreparationChecklist(vehicleId, operatorId);
        return "redirect:/preparations?vehicleId=" + vehicleId;
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
