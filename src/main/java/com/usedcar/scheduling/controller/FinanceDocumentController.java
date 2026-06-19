package com.usedcar.scheduling.controller;

import com.usedcar.scheduling.domain.FinanceDocument;
import com.usedcar.scheduling.enums.DocumentStatus;
import com.usedcar.scheduling.service.FinanceDocumentService;
import com.usedcar.scheduling.service.VehicleService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequiredArgsConstructor
public class FinanceDocumentController {

    private final FinanceDocumentService financeDocumentService;
    private final VehicleService vehicleService;

    @GetMapping("/finance")
    public String list(@RequestParam Long vehicleId, Model model, HttpServletRequest request) {
        addCommonAttributes(model, request);
        model.addAttribute("documents",
                financeDocumentService.findByVehicleId(vehicleId).stream().map(financeDocumentService::toDTO).toList());
        model.addAttribute("vehicle", vehicleService.toDTO(vehicleService.findById(vehicleId)));
        return "finance/config";
    }

    @PostMapping("/finance")
    public String upload(FinanceDocument document, @RequestParam Long vehicleId) {
        financeDocumentService.upload(document);
        return "redirect:/finance?vehicleId=" + vehicleId;
    }

    @PostMapping("/finance/{id}/status")
    public String updateStatus(@PathVariable Long id,
                               @RequestParam Long vehicleId,
                               @RequestParam DocumentStatus newStatus,
                               @RequestParam Long operatorId,
                               @RequestParam(required = false) String remark) {
        financeDocumentService.updateStatus(id, newStatus, operatorId, remark);
        return "redirect:/finance?vehicleId=" + vehicleId;
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
