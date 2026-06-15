package com.renewal.repository;

import com.renewal.entity.ReviewMaterial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ReviewMaterialRepository extends JpaRepository<ReviewMaterial, Long> {

    List<ReviewMaterial> findByStatusOrderByCreatedAtDesc(ReviewMaterial.ReviewStatus status);

    @Query("SELECT r FROM ReviewMaterial r WHERE r.periodStart <= :end AND r.periodEnd >= :start ORDER BY r.periodStart DESC")
    List<ReviewMaterial> findByPeriodOverlap(@Param("start") LocalDate start, @Param("end") LocalDate end);
}
