package com.usedcar.scheduling.controller;

import com.usedcar.scheduling.enums.PreparationStatus;
import com.usedcar.scheduling.service.PreparationService;
import com.usedcar.scheduling.service.VehicleService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequiredArgsConstructor
public class PreparationController {

    private final PreparationService preparationService;
    private final VehicleService vehicleService;

    @GetMapping("/preparations")
    public String list(@RequestParam Long vehicleId, Model model, HttpServletRequest request) {
        addCommonAttributes(model, request);
        model.addAttribute("preparations",
                preparationService.findByVehicleId(vehicleId).stream().map(preparationService::toDTO).toList());
        model.addAttribute("vehicle", vehicleService.toDTO(vehicleService.findById(vehicleId)));
        return "preparation/list";
    }

    @PostMapping("/preparations/{id}/status")
    public String updateStatus(@PathVariable Long id,
                               @RequestParam Long vehicleId,
                               @RequestParam PreparationStatus newStatus,
                               @RequestParam Long operatorId,
                               @RequestParam(required = false) String remark) {
        preparationService.updateItemStatus(id, newStatus, operatorId, remark);
        return "redirect:/preparations?vehicleId=" + vehicleId;
    }

    @PostMapping("/preparations/init")
    public String initChecklist(@RequestParam Long vehicleId, @RequestParam Long operatorId) {
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
