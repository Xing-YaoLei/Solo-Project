package com.usedcar.scheduling.service.impl;

import com.usedcar.scheduling.domain.VehicleArchive;
import com.usedcar.scheduling.repository.VehicleArchiveRepository;
import com.usedcar.scheduling.service.VehicleArchiveService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class VehicleArchiveServiceImpl implements VehicleArchiveService {

    private final VehicleArchiveRepository vehicleArchiveRepository;

    @Override
    public Page<VehicleArchive> findAll(Pageable pageable) {
        return vehicleArchiveRepository.findAll(pageable);
    }

    @Override
    public List<VehicleArchive> findByVehicleId(Long vehicleId) {
        return vehicleArchiveRepository.findByVehicleIdOrderByCreatedAtDesc(vehicleId);
    }

    @Override
    @Transactional
    public VehicleArchive createArchive(VehicleArchive archive) {
        return vehicleArchiveRepository.save(archive);
    }
}
