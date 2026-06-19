package com.usedcar.scheduling.controller;

import com.usedcar.scheduling.domain.QuotationHistory;
import com.usedcar.scheduling.service.QuotationService;
import com.usedcar.scheduling.service.VehicleService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequiredArgsConstructor
public class QuotationController {

    private final QuotationService quotationService;
    private final VehicleService vehicleService;

    @GetMapping("/quotations")
    public String list(@RequestParam Long vehicleId, Model model, HttpServletRequest request) {
        addCommonAttributes(model, request);
        model.addAttribute("quotations",
                quotationService.findByVehicleId(vehicleId).stream().map(quotationService::toDTO).toList());
        model.addAttribute("vehicle", vehicleService.toDTO(vehicleService.findById(vehicleId)));
        return "quotation/list";
    }

    @PostMapping("/quotations")
    public String create(QuotationHistory quotation, @RequestParam Long vehicleId) {
        quotationService.create(quotation);
        return "redirect:/quotations?vehicleId=" + vehicleId;
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
