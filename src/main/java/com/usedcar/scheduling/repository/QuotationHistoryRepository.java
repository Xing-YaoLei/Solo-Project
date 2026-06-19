package com.usedcar.scheduling.repository;

import com.usedcar.scheduling.domain.QuotationHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface QuotationHistoryRepository extends JpaRepository<QuotationHistory, Long>, JpaSpecificationExecutor<QuotationHistory> {

    List<QuotationHistory> findByVehicleId(Long vehicleId);

    List<QuotationHistory> findByVehicleIdOrderByCreatedAtDesc(Long vehicleId);

    @Query("SELECT q FROM QuotationHistory q WHERE q.vehicle.id = :vehicleId AND q.createdAt BETWEEN :start AND :end")
    List<QuotationHistory> findByVehicleAndDateRange(@Param("vehicleId") Long vehicleId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
