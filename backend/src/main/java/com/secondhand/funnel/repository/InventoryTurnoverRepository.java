package com.secondhand.funnel.repository;

import com.secondhand.funnel.entity.InventoryTurnover;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryTurnoverRepository extends JpaRepository<InventoryTurnover, Long> {
    List<InventoryTurnover> findByCarIdOrderByCalculatedAtDesc(Long carId);
    Optional<InventoryTurnover> findTopByCarIdOrderByCalculatedAtDesc(Long carId);

    @Query("SELECT AVG(it.daysInInventory) FROM InventoryTurnover it WHERE it.turnoverStage = :stage")
    Double findAvgDaysByStage(@Param("stage") String stage);

    @Query("SELECT AVG(it.daysInInventory) FROM InventoryTurnover it")
    Double findOverallAvgDays();
}
