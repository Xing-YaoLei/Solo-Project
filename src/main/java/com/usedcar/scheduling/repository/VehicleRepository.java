package com.usedcar.scheduling.repository;

import com.usedcar.scheduling.domain.Vehicle;
import com.usedcar.scheduling.enums.VehicleStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface VehicleRepository extends JpaRepository<Vehicle, Long>, JpaSpecificationExecutor<Vehicle> {

    Page<Vehicle> findByStatus(VehicleStatus status, Pageable pageable);

    List<Vehicle> findByStatus(VehicleStatus status);

    List<Vehicle> findByStoreId(Long storeId);

    List<Vehicle> findByAssessorId(Long assessorId);

    List<Vehicle> findBySalesId(Long salesId);

    Optional<Vehicle> findByVin(String vin);

    List<Vehicle> findByBrandContainingAndModelContaining(String brand, String model);

    List<Vehicle> findByStatusIn(List<VehicleStatus> statuses);

    @Query("SELECT v FROM Vehicle v WHERE v.store.id = :storeId AND v.status IN :statuses")
    List<Vehicle> findByStoreAndStatuses(@Param("storeId") Long storeId, @Param("statuses") List<VehicleStatus> statuses);

    long countByStatusAndStoreId(VehicleStatus status, Long storeId);

    long countByStatus(VehicleStatus status);
}
