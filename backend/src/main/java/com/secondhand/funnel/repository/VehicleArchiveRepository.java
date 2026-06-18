package com.secondhand.funnel.repository;

import com.secondhand.funnel.entity.VehicleArchive;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleArchiveRepository extends JpaRepository<VehicleArchive, Long> {
    Optional<VehicleArchive> findByCarId(Long carId);
    List<VehicleArchive> findByIsComplete(Boolean isComplete);
    void deleteByCarId(Long carId);
}
