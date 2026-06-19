package com.usedcar.scheduling.controller;

import com.usedcar.scheduling.domain.QuotationHistory;
import com.usedcar.scheduling.domain.User;
import com.usedcar.scheduling.domain.Vehicle;
import com.usedcar.scheduling.repository.UserRepository;
import com.usedcar.scheduling.service.QuotationService;
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
public class QuotationController {

    private final QuotationService quotationService;
    private final VehicleService vehicleService;
    private final UserRepository userRepository;

    @GetMapping("/quotations")
    public String list(@RequestParam(required = false) Long vehicleId,
                       @RequestParam(defaultValue = "0") int page,
                       @RequestParam(defaultValue = "20") int size,
                       Model model, HttpServletRequest request) {
        addCommonAttributes(model, request);
        if (vehicleId == null) {
            Page<?> quotations = quotationService.findAll(PageRequest.of(page, size))
                    .map(quotationService::toDTO);
            model.addAttribute("quotations", quotations);
            model.addAttribute("vehicles", vehicleService.findAll(PageRequest.of(0, 1000)).getContent());
            model.addAttribute("selectedVehicleId", null);
        } else {
            model.addAttribute("quotations",
                    quotationService.findByVehicleId(vehicleId).stream().map(quotationService::toDTO).toList());
            model.addAttribute("vehicle", vehicleService.toDTO(vehicleService.findById(vehicleId)));
            model.addAttribute("selectedVehicleId", vehicleId);
        }
        return "quotation/list";
    }

    @PostMapping("/quotations")
    public String create(QuotationHistory quotation,
                         @RequestParam(defaultValue = "0") Long vehicleId,
                         @RequestParam(defaultValue = "1") Long operatorId) {
        User operator = userRepository.findById(operatorId).orElse(null);
        Vehicle vehicle = vehicleService.findById(vehicleId);
        quotation.setOperator(operator);
        quotation.setVehicle(vehicle);
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
