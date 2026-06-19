package com.usedcar.scheduling.service;

import com.usedcar.scheduling.domain.PreparationChecklist;
import com.usedcar.scheduling.dto.PreparationDTO;
import com.usedcar.scheduling.enums.PreparationStatus;

import java.util.List;

public interface PreparationService {

    List<PreparationChecklist> findByVehicleId(Long vehicleId);

    PreparationChecklist updateItemStatus(Long itemId, PreparationStatus newStatus, Long operatorId, String remark);

    List<PreparationChecklist> initPreparationChecklist(Long vehicleId, Long operatorId);

    boolean isAllCompleted(Long vehicleId);

    PreparationDTO toDTO(PreparationChecklist item);
}
