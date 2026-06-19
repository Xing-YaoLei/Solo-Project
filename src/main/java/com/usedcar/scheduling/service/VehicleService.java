package com.usedcar.scheduling.service;

import com.usedcar.scheduling.domain.Vehicle;
import com.usedcar.scheduling.dto.VehicleDTO;
import com.usedcar.scheduling.enums.VehicleStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;

public interface VehicleService {

    Vehicle findById(Long id);

    Page<Vehicle> findAll(Pageable pageable);

    Page<Vehicle> findByStatus(VehicleStatus status, Pageable pageable);

    Page<Vehicle> search(String brand, String model, VehicleStatus status, Long storeId, Pageable pageable);

    Vehicle create(Vehicle vehicle);

    Vehicle updateStatus(Long vehicleId, VehicleStatus newStatus, Long operatorId, String remark);

    Vehicle updateListingPrice(Long vehicleId, BigDecimal newPrice, Long operatorId, String remark);

    Vehicle assignAssessor(Long vehicleId, Long assessorId, Long operatorId);

    Vehicle assignSales(Long vehicleId, Long salesId, Long operatorId);

    void delete(Long id);

    VehicleDTO toDTO(Vehicle vehicle);

    List<VehicleDTO> toDTOList(List<Vehicle> vehicles);
}
