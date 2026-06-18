package com.secondhand.funnel.repository;

import com.secondhand.funnel.entity.DataAnomaly;
import com.secondhand.funnel.enums.AnomalyType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DataAnomalyRepository extends JpaRepository<DataAnomaly, Long> {
    List<DataAnomaly> findByCarId(Long carId);
    List<DataAnomaly> findByAnomalyType(AnomalyType anomalyType);
    List<DataAnomaly> findByResolved(Boolean resolved);
    List<DataAnomaly> findByCarIdAndResolved(Long carId, Boolean resolved);
    long countByResolved(Boolean resolved);

    @Query("SELECT d.anomalyType, COUNT(d) FROM DataAnomaly d WHERE d.resolved = false GROUP BY d.anomalyType")
    List<Object[]> countUnresolvedByType();

    @Query("SELECT COUNT(d) FROM DataAnomaly d WHERE d.carId = :carId AND d.resolved = false")
    long countUnresolvedByCarId(@Param("carId") Long carId);

    @Query("SELECT COUNT(d) FROM DataAnomaly d WHERE d.anomalyType = :type AND d.resolved = :resolved")
    long countByAnomalyTypeAndResolved(@Param("type") AnomalyType anomalyType, @Param("resolved") Boolean resolved);
}
