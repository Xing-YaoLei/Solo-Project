package com.usedcar.scheduling.service;

import com.usedcar.scheduling.domain.VehicleArchive;

import java.util.List;

public interface VehicleArchiveService {

    List<VehicleArchive> findByVehicleId(Long vehicleId);

    VehicleArchive createArchive(VehicleArchive archive);
}
