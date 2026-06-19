package com.usedcar.scheduling.service.impl;

import com.usedcar.scheduling.domain.User;
import com.usedcar.scheduling.domain.Vehicle;
import com.usedcar.scheduling.domain.VehicleArchive;
import com.usedcar.scheduling.dto.VehicleDTO;
import com.usedcar.scheduling.enums.ArchiveType;
import com.usedcar.scheduling.enums.DocumentStatus;
import com.usedcar.scheduling.enums.PreparationStatus;
import com.usedcar.scheduling.enums.VehicleStatus;
import com.usedcar.scheduling.repository.FinanceDocumentRepository;
import com.usedcar.scheduling.repository.PreparationChecklistRepository;
import com.usedcar.scheduling.repository.UserRepository;
import com.usedcar.scheduling.repository.VehicleArchiveRepository;
import com.usedcar.scheduling.repository.VehicleRepository;
import com.usedcar.scheduling.service.VehicleService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class VehicleServiceImpl implements VehicleService {

    private final VehicleRepository vehicleRepository;
    private final VehicleArchiveRepository vehicleArchiveRepository;
    private final UserRepository userRepository;
    private final PreparationChecklistRepository preparationChecklistRepository;
    private final FinanceDocumentRepository financeDocumentRepository;

    @Override
    public Vehicle findById(Long id) {
        return vehicleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("车辆不存在: " + id));
    }

    @Override
    public Page<Vehicle> findAll(Pageable pageable) {
        return vehicleRepository.findAll(pageable);
    }

    @Override
    public Page<Vehicle> findByStatus(VehicleStatus status, Pageable pageable) {
        return vehicleRepository.findByStatus(status, pageable);
    }

    @Override
    public Page<Vehicle> search(String brand, String model, VehicleStatus status, Long storeId, Pageable pageable) {
        Specification<Vehicle> spec = Specification.where(null);
        if (brand != null && !brand.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("brand")), "%" + brand.toLowerCase() + "%"));
        }
        if (model != null && !model.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("model")), "%" + model.toLowerCase() + "%"));
        }
        if (status != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }
        if (storeId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("store").get("id"), storeId));
        }
        return vehicleRepository.findAll(spec, pageable);
    }

    @Override
    @Transactional
    public Vehicle create(Vehicle vehicle) {
        return vehicleRepository.save(vehicle);
    }

    @Override
    @Transactional
    public Vehicle updateStatus(Long vehicleId, VehicleStatus newStatus, Long operatorId, String remark) {
        Vehicle vehicle = findById(vehicleId);
        VehicleStatus oldStatus = vehicle.getStatus();
        vehicle.setStatus(newStatus);

        VehicleArchive archive = new VehicleArchive();
        archive.setVehicle(vehicle);
        archive.setArchiveType(ArchiveType.STATUS_CHANGE);
        archive.setOldValue(oldStatus.name());
        archive.setNewValue(newStatus.name());
        archive.setRemark(remark);
        if (operatorId != null) {
            User operator = userRepository.findById(operatorId).orElse(null);
            archive.setOperator(operator);
        }
        vehicleArchiveRepository.save(archive);

        return vehicleRepository.save(vehicle);
    }

    @Override
    @Transactional
    public Vehicle updateListingPrice(Long vehicleId, BigDecimal newPrice, Long operatorId, String remark) {
        Vehicle vehicle = findById(vehicleId);
        BigDecimal oldPrice = vehicle.getListingPrice();
        vehicle.setListingPrice(newPrice);

        VehicleArchive archive = new VehicleArchive();
        archive.setVehicle(vehicle);
        archive.setArchiveType(ArchiveType.PRICE_ADJUST);
        archive.setOldValue(oldPrice != null ? oldPrice.toPlainString() : null);
        archive.setNewValue(newPrice.toPlainString());
        archive.setRemark(remark);
        if (operatorId != null) {
            User operator = userRepository.findById(operatorId).orElse(null);
            archive.setOperator(operator);
        }
        vehicleArchiveRepository.save(archive);

        return vehicleRepository.save(vehicle);
    }

    @Override
    @Transactional
    public Vehicle assignAssessor(Long vehicleId, Long assessorId, Long operatorId) {
        Vehicle vehicle = findById(vehicleId);
        String oldAssessorName = vehicle.getAssessor() != null ? vehicle.getAssessor().getRealName() : null;

        User assessor = userRepository.findById(assessorId)
                .orElseThrow(() -> new IllegalArgumentException("评估师不存在: " + assessorId));
        vehicle.setAssessor(assessor);

        VehicleArchive archive = new VehicleArchive();
        archive.setVehicle(vehicle);
        archive.setArchiveType(ArchiveType.OWNER_CHANGE);
        archive.setOldValue(oldAssessorName);
        archive.setNewValue(assessor.getRealName());
        if (operatorId != null) {
            User operator = userRepository.findById(operatorId).orElse(null);
            archive.setOperator(operator);
        }
        vehicleArchiveRepository.save(archive);

        return vehicleRepository.save(vehicle);
    }

    @Override
    @Transactional
    public Vehicle assignSales(Long vehicleId, Long salesId, Long operatorId) {
        Vehicle vehicle = findById(vehicleId);
        String oldSalesName = vehicle.getSales() != null ? vehicle.getSales().getRealName() : null;

        User sales = userRepository.findById(salesId)
                .orElseThrow(() -> new IllegalArgumentException("销售不存在: " + salesId));
        vehicle.setSales(sales);

        VehicleArchive archive = new VehicleArchive();
        archive.setVehicle(vehicle);
        archive.setArchiveType(ArchiveType.OWNER_CHANGE);
        archive.setOldValue(oldSalesName);
        archive.setNewValue(sales.getRealName());
        if (operatorId != null) {
            User operator = userRepository.findById(operatorId).orElse(null);
            archive.setOperator(operator);
        }
        vehicleArchiveRepository.save(archive);

        return vehicleRepository.save(vehicle);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        vehicleRepository.deleteById(id);
    }

    @Override
    public VehicleDTO toDTO(Vehicle vehicle) {
        VehicleDTO dto = new VehicleDTO();
        dto.setId(vehicle.getId());
        dto.setVin(vehicle.getVin());
        dto.setBrand(vehicle.getBrand());
        dto.setModel(vehicle.getModel());
        dto.setYear(vehicle.getYear());
        dto.setColor(vehicle.getColor());
        dto.setMileage(vehicle.getMileage());
        dto.setPurchasePrice(vehicle.getPurchasePrice());
        dto.setListingPrice(vehicle.getListingPrice());
        dto.setStatus(vehicle.getStatus().name());
        dto.setAssessorName(vehicle.getAssessor() != null ? vehicle.getAssessor().getRealName() : null);
        dto.setSalesName(vehicle.getSales() != null ? vehicle.getSales().getRealName() : null);
        dto.setStoreName(vehicle.getStore() != null ? vehicle.getStore().getName() : null);
        dto.setPurchaseDate(vehicle.getPurchaseDate());
        dto.setListingDate(vehicle.getListingDate());

        List<?> allItems = preparationChecklistRepository.findByVehicleId(vehicle.getId());
        long doneItems = preparationChecklistRepository.countByVehicleIdAndStatus(vehicle.getId(), PreparationStatus.DONE);
        dto.setPreparationProgress(allItems.isEmpty() ? 0 : (int) (doneItems * 100 / allItems.size()));

        long missingDocs = financeDocumentRepository.countByVehicleIdAndStatus(vehicle.getId(), DocumentStatus.MISSING);
        dto.setMissingDocumentCount((int) missingDocs);

        return dto;
    }

    @Override
    public List<VehicleDTO> toDTOList(List<Vehicle> vehicles) {
        return vehicles.stream().map(this::toDTO).toList();
    }
}
