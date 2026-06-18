package com.secondhand.funnel.repository;

import com.secondhand.funnel.entity.CarInventory;
import com.secondhand.funnel.enums.CarStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CarInventoryRepository extends JpaRepository<CarInventory, Long> {
    CarInventory findByCarVin(String carVin);
    List<CarInventory> findByStatus(CarStatus status);
    List<CarInventory> findByAssessorId(Long assessorId);
    long countByStatus(CarStatus status);

    @Query("SELECT c FROM CarInventory c WHERE c.sourceLibraryDelay = true OR c.detectorMissing = true")
    List<CarInventory> findCarsWithAnomalies();

    @Query("SELECT COUNT(c) FROM CarInventory c WHERE c.sourceLibraryDelay = true OR c.detectorMissing = true")
    long countCarsWithAnomalies();

    @Query("SELECT c.status, COUNT(c) FROM CarInventory c GROUP BY c.status")
    List<Object[]> countByStatusGroup();

    @Query("SELECT c FROM CarInventory c WHERE c.id IN :ids")
    List<CarInventory> findByIds(@Param("ids") List<Long> ids);

    long countBySourceLibraryDelay(Boolean sourceLibraryDelay);
    long countByDetectorMissing(Boolean detectorMissing);
}
