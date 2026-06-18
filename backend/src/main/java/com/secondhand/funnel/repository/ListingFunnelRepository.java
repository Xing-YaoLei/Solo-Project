package com.secondhand.funnel.repository;

import com.secondhand.funnel.entity.ListingFunnel;
import com.secondhand.funnel.enums.FunnelStage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ListingFunnelRepository extends JpaRepository<ListingFunnel, Long> {
    List<ListingFunnel> findByCarId(Long carId);
    List<ListingFunnel> findByStage(FunnelStage stage);
    List<ListingFunnel> findByStageAndIsCompleted(FunnelStage stage, Boolean isCompleted);
    Optional<ListingFunnel> findByCarIdAndStage(Long carId, FunnelStage stage);

    @Query("SELECT f.stage, COUNT(f), SUM(CASE WHEN f.isCompleted = true THEN 1 ELSE 0 END) " +
           "FROM ListingFunnel f GROUP BY f.stage ORDER BY f.stage")
    List<Object[]> countByStageGroup();

    @Query("SELECT COUNT(f) FROM ListingFunnel f WHERE f.stage = :stage AND f.isCompleted = :completed")
    long countByStageAndIsCompleted(@Param("stage") FunnelStage stage, @Param("completed") Boolean completed);

    @Query("SELECT COUNT(DISTINCT f.carId) FROM ListingFunnel f WHERE f.stage = :stage")
    long countDistinctCarIdByStage(@Param("stage") FunnelStage stage);

    void deleteByCarId(Long carId);
}
