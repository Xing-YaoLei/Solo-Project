package com.usedcar.scheduling.repository;

import com.usedcar.scheduling.domain.VehicleArchive;
import com.usedcar.scheduling.enums.ArchiveType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface VehicleArchiveRepository extends JpaRepository<VehicleArchive, Long> {

    Page<VehicleArchive> findByArchiveTypeAndCreatedAtBetween(ArchiveType type, LocalDateTime start, LocalDateTime end, Pageable pageable);

    Page<VehicleArchive> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end, Pageable pageable);

    List<VehicleArchive> findByVehicleIdOrderByCreatedAtDesc(Long vehicleId);

    List<VehicleArchive> findByVehicleIdAndArchiveType(Long vehicleId, ArchiveType type);

    @Query("SELECT a FROM VehicleArchive a WHERE a.vehicle.id = :vehicleId AND a.createdAt BETWEEN :start AND :end")
    List<VehicleArchive> findByVehicleAndDateRange(@Param("vehicleId") Long vehicleId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
