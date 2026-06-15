package com.renewal.repository;

import com.renewal.entity.RenewalFunnelStage;
import com.renewal.entity.RenewalFunnelStage.FunnelStage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RenewalFunnelStageRepository extends JpaRepository<RenewalFunnelStage, Long> {

    List<RenewalFunnelStage> findByEnrollmentIdOrderByStageEnteredAtDesc(Long enrollmentId);

    @Query("SELECT s FROM RenewalFunnelStage s WHERE s.enrollmentId = :enrollmentId AND s.stage = :stage AND s.stageExitedAt IS NULL")
    List<RenewalFunnelStage> findActiveStage(@Param("enrollmentId") Long enrollmentId, @Param("stage") FunnelStage stage);

    @Query("SELECT s.stage, COUNT(s) FROM RenewalFunnelStage s WHERE s.stageExitedAt IS NULL GROUP BY s.stage")
    List<Object[]> countByActiveStage();

    long countByStageAndStageExitedAtIsNull(FunnelStage stage);
}
