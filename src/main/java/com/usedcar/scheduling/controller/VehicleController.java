package com.usedcar.scheduling.controller;

import com.usedcar.scheduling.domain.Vehicle;
import com.usedcar.scheduling.dto.VehicleDTO;
import com.usedcar.scheduling.enums.UserRole;
import com.usedcar.scheduling.enums.VehicleStatus;
import com.usedcar.scheduling.repository.StoreRepository;
import com.usedcar.scheduling.repository.UserRepository;
import com.usedcar.scheduling.service.*;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.math.BigDecimal;

@Controller
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleService vehicleService;
    private final PreparationService preparationService;
    private final TestDriveService testDriveService;
    private final QuotationService quotationService;
    private final FinanceDocumentService financeDocumentService;
    private final VehicleArchiveService vehicleArchiveService;
    private final TodoPoolService todoPoolService;
    private final StoreRepository storeRepository;
    private final UserRepository userRepository;

    @GetMapping("/vehicles")
    public String list(@RequestParam(required = false) String brand,
                       @RequestParam(required = false) String model,
                       @RequestParam(required = false) VehicleStatus status,
                       @RequestParam(required = false) Long storeId,
                       @RequestParam(defaultValue = "0") int page,
                       @RequestParam(defaultValue = "20") int size,
                       Model viewModel, HttpServletRequest request) {
        addCommonAttributes(viewModel, request);
        Page<Vehicle> vehicles = vehicleService.search(brand, model, status, storeId, PageRequest.of(page, size));
        Page<VehicleDTO> vehicleDTOs = vehicles.map(vehicleService::toDTO);
        viewModel.addAttribute("vehicles", vehicleDTOs);
        viewModel.addAttribute("statuses", VehicleStatus.values());
        viewModel.addAttribute("stores", storeRepository.findAll());
        return "vehicle/list";
    }

    @GetMapping("/vehicles/{id}")
    public String detail(@PathVariable Long id, Model viewModel, HttpServletRequest request) {
        addCommonAttributes(viewModel, request);
        VehicleDTO vehicle = vehicleService.toDTO(vehicleService.findById(id));
        viewModel.addAttribute("vehicle", vehicle);
        viewModel.addAttribute("preparations",
                preparationService.findByVehicleId(id).stream().map(preparationService::toDTO).toList());
        viewModel.addAttribute("testDrives",
                testDriveService.findByVehicleId(id).stream().map(testDriveService::toDTO).toList());
        viewModel.addAttribute("quotations",
                quotationService.findByVehicleId(id).stream().map(quotationService::toDTO).toList());
        viewModel.addAttribute("financeDocs",
                financeDocumentService.findByVehicleId(id).stream().map(financeDocumentService::toDTO).toList());
        viewModel.addAttribute("archives", vehicleArchiveService.findByVehicleId(id));
        viewModel.addAttribute("todos",
                todoPoolService.findAllTodos(null, null, PageRequest.of(0, 20))
                                .stream().map(todoPoolService::toDTO).toList());
        viewModel.addAttribute("assessors", userRepository.findByRole(UserRole.ASSESSOR));
        viewModel.addAttribute("salesList", userRepository.findByRole(UserRole.SALES));
        return "vehicle/detail";
    }

    @GetMapping("/vehicles/archive")
    public String archiveList(@RequestParam(defaultValue = "0") int page,
                              @RequestParam(defaultValue = "20") int size,
                              Model model, HttpServletRequest request) {
        addCommonAttributes(model, request);
        String role = request.getHeader("X-User-Role") != null ? request.getHeader("X-User-Role") : "MANAGER";
        if (!"MANAGER".equals(role)) {
            return "redirect:/vehicles";
        }
        Page<?> archives = vehicleArchiveService.findAll(PageRequest.of(page, size));
        model.addAttribute("archives", archives);
        return "vehicle/archive-list";
    }

    @GetMapping("/vehicles/create")
    public String createForm(Model viewModel, HttpServletRequest request) {
        addCommonAttributes(viewModel, request);
        viewModel.addAttribute("stores", storeRepository.findAll());
        viewModel.addAttribute("assessors", userRepository.findByRole(UserRole.ASSESSOR));
        viewModel.addAttribute("salesList", userRepository.findByRole(UserRole.SALES));
        return "vehicle/form";
    }

    @PostMapping("/vehicles")
    public String create(Vehicle vehicle, RedirectAttributes redirectAttributes) {
        vehicleService.create(vehicle);
        return "redirect:/vehicles";
    }

    @PostMapping("/vehicles/{id}/status")
    public String updateStatus(@PathVariable Long id,
                               @RequestParam VehicleStatus newStatus,
                               @RequestParam(defaultValue = "1") Long operatorId,
                               @RequestParam(required = false) String remark) {
        vehicleService.updateStatus(id, newStatus, operatorId, remark);
        return "redirect:/vehicles/" + id;
    }

    @PostMapping("/vehicles/{id}/price")
    public String updatePrice(@PathVariable Long id,
                              @RequestParam BigDecimal newPrice,
                              @RequestParam(defaultValue = "1") Long operatorId,
                              @RequestParam(required = false) String remark) {
        vehicleService.updateListingPrice(id, newPrice, operatorId, remark);
        return "redirect:/vehicles/" + id;
    }

    @PostMapping("/vehicles/{id}/assign-assessor")
    public String assignAssessor(@PathVariable Long id,
                                 @RequestParam Long assessorId,
                                 @RequestParam(defaultValue = "1") Long operatorId) {
        vehicleService.assignAssessor(id, assessorId, operatorId);
        return "redirect:/vehicles/" + id;
    }

    @PostMapping("/vehicles/{id}/assign-sales")
    public String assignSales(@PathVariable Long id,
                              @RequestParam Long salesId,
                              @RequestParam(defaultValue = "1") Long operatorId) {
        vehicleService.assignSales(id, salesId, operatorId);
        return "redirect:/vehicles/" + id;
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
