package com.usedcar.scheduling.service.impl;

import com.usedcar.scheduling.domain.PreparationChecklist;
import com.usedcar.scheduling.domain.User;
import com.usedcar.scheduling.domain.Vehicle;
import com.usedcar.scheduling.dto.PreparationDTO;
import com.usedcar.scheduling.enums.PreparationItemName;
import com.usedcar.scheduling.enums.PreparationStatus;
import com.usedcar.scheduling.repository.PreparationChecklistRepository;
import com.usedcar.scheduling.repository.UserRepository;
import com.usedcar.scheduling.repository.VehicleRepository;
import com.usedcar.scheduling.service.PreparationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PreparationServiceImpl implements PreparationService {

    private final PreparationChecklistRepository preparationChecklistRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;

    @Override
    public Page<PreparationChecklist> findAll(Pageable pageable) {
        return preparationChecklistRepository.findAll(pageable);
    }

    @Override
    public List<PreparationChecklist> findByVehicleId(Long vehicleId) {
        return preparationChecklistRepository.findByVehicleId(vehicleId);
    }

    @Override
    @Transactional
    public PreparationChecklist updateItemStatus(Long itemId, PreparationStatus newStatus, Long operatorId, String remark) {
        PreparationChecklist item = preparationChecklistRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("整备项不存在: " + itemId));
        item.setStatus(newStatus);
        item.setRemark(remark);
        if (operatorId != null) {
            User operator = userRepository.findById(operatorId)
                    .orElseThrow(() -> new IllegalArgumentException("操作人不存在: " + operatorId));
            item.setOperator(operator);
        }
        if (newStatus == PreparationStatus.DONE) {
            item.setCompletedAt(LocalDateTime.now());
        }
        return preparationChecklistRepository.save(item);
    }

    @Override
    @Transactional
    public List<PreparationChecklist> initPreparationChecklist(Long vehicleId, Long operatorId) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new IllegalArgumentException("车辆不存在: " + vehicleId));
        User operator = operatorId != null ? userRepository.findById(operatorId).orElse(null) : null;

        List<PreparationChecklist> items = new ArrayList<>();
        for (PreparationItemName itemName : PreparationItemName.values()) {
            PreparationChecklist item = new PreparationChecklist();
            item.setVehicle(vehicle);
            item.setItemName(itemName);
            item.setStatus(PreparationStatus.PENDING);
            item.setOperator(operator);
            items.add(item);
        }
        return preparationChecklistRepository.saveAll(items);
    }

    @Override
    public boolean isAllCompleted(Long vehicleId) {
        long totalItems = preparationChecklistRepository.findByVehicleId(vehicleId).size();
        if (totalItems == 0) {
            return false;
        }
        long completedItems = preparationChecklistRepository.countByVehicleIdAndStatus(vehicleId, PreparationStatus.DONE);
        return totalItems == completedItems;
    }

    @Override
    public PreparationDTO toDTO(PreparationChecklist item) {
        PreparationDTO dto = new PreparationDTO();
        dto.setId(item.getId());
        dto.setVehicleId(item.getVehicle().getId());
        dto.setVehicleVin(item.getVehicle().getVin());
        dto.setVehicleInfo(item.getVehicle().getVin() + " - " + item.getVehicle().getBrand() + " " + item.getVehicle().getModel());
        dto.setItemName(item.getItemName().name());
        dto.setStatus(item.getStatus().name());
        dto.setOperatorName(item.getOperator() != null ? item.getOperator().getRealName() : null);
        dto.setCompletedAt(item.getCompletedAt());
        dto.setRemark(item.getRemark());
        return dto;
    }
}
