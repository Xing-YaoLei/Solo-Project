package com.usedcar.scheduling.repository;

import com.usedcar.scheduling.domain.PreparationChecklist;
import com.usedcar.scheduling.enums.PreparationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PreparationChecklistRepository extends JpaRepository<PreparationChecklist, Long> {

    List<PreparationChecklist> findByVehicleId(Long vehicleId);

    List<PreparationChecklist> findByVehicleIdAndStatus(Long vehicleId, PreparationStatus status);

    long countByVehicleIdAndStatus(Long vehicleId, PreparationStatus status);
}
