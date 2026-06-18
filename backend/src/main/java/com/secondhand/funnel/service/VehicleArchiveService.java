package com.secondhand.funnel.service;

import com.secondhand.funnel.entity.VehicleArchive;

import java.util.List;
import java.util.Map;

public interface VehicleArchiveService {
    VehicleArchive createOrUpdate(Long carId, VehicleArchive archive);
    VehicleArchive getById(Long id);
    VehicleArchive getByCarId(Long carId);
    VehicleArchive update(Long id, VehicleArchive archive);
    void delete(Long id);
    List<VehicleArchive> listAll();
    List<VehicleArchive> getIncompleteArchives();
    VehicleArchive updateArchiveData(Long carId, Map<String, Object> archiveData);
    boolean checkArchiveComplete(Long carId);
}
