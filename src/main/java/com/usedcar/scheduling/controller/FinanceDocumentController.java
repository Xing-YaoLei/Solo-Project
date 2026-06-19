package com.usedcar.scheduling.controller;

import com.usedcar.scheduling.domain.FinanceDocument;
import com.usedcar.scheduling.domain.User;
import com.usedcar.scheduling.domain.Vehicle;
import com.usedcar.scheduling.enums.DocumentStatus;
import com.usedcar.scheduling.repository.UserRepository;
import com.usedcar.scheduling.service.FinanceDocumentService;
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
public class FinanceDocumentController {

    private final FinanceDocumentService financeDocumentService;
    private final VehicleService vehicleService;
    private final UserRepository userRepository;

    @GetMapping("/finance")
    public String list(@RequestParam(required = false) Long vehicleId,
                       @RequestParam(defaultValue = "0") int page,
                       @RequestParam(defaultValue = "20") int size,
                       Model model, HttpServletRequest request) {
        addCommonAttributes(model, request);
        if (vehicleId == null) {
            Page<?> documents = financeDocumentService.findAll(PageRequest.of(page, size))
                    .map(financeDocumentService::toDTO);
            model.addAttribute("documents", documents);
            model.addAttribute("vehicles", vehicleService.findAll(PageRequest.of(0, 1000)).getContent());
            model.addAttribute("selectedVehicleId", null);
        } else {
            model.addAttribute("documents",
                    financeDocumentService.findByVehicleId(vehicleId).stream().map(financeDocumentService::toDTO).toList());
            model.addAttribute("vehicle", vehicleService.toDTO(vehicleService.findById(vehicleId)));
            model.addAttribute("selectedVehicleId", vehicleId);
        }
        return "finance/config";
    }

    @PostMapping("/finance")
    public String upload(FinanceDocument document,
                         @RequestParam(required = false) Long vehicleId,
                         @RequestParam(defaultValue = "1") Long uploaderId,
                         RedirectAttributes redirectAttributes) {
        if (vehicleId == null) {
            redirectAttributes.addFlashAttribute("error", "请选择车辆");
            return "redirect:/finance";
        }
        User uploader = userRepository.findById(uploaderId).orElse(null);
        Vehicle vehicle = vehicleService.findById(vehicleId);
        document.setUploader(uploader);
        document.setVehicle(vehicle);
        financeDocumentService.upload(document);
        return "redirect:/finance?vehicleId=" + vehicleId;
    }

    @PostMapping("/finance/{id}/status")
    public String updateStatus(@PathVariable Long id,
                               @RequestParam(required = false) Long vehicleId,
                               @RequestParam DocumentStatus status,
                               @RequestParam(defaultValue = "1") Long operatorId,
                               @RequestParam(required = false) String remark) {
        financeDocumentService.updateStatus(id, status, operatorId, remark);
        return "redirect:/finance" + (vehicleId != null ? "?vehicleId=" + vehicleId : "");
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
