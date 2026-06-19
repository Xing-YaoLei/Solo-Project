package com.usedcar.scheduling.service;

import com.usedcar.scheduling.domain.VehicleArchive;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface VehicleArchiveService {

    Page<VehicleArchive> findAll(Pageable pageable);

    List<VehicleArchive> findByVehicleId(Long vehicleId);

    VehicleArchive createArchive(VehicleArchive archive);
}
