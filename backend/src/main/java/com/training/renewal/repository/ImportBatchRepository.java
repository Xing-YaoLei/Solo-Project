package com.training.renewal.repository;

import com.training.renewal.entity.ImportBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ImportBatchRepository extends JpaRepository<ImportBatch, Long> {

    Optional<ImportBatch> findByBatchId(String batchId);

    List<ImportBatch> findByBatchTypeOrderByBatchTimeDesc(String batchType);

    List<ImportBatch> findTop10ByOrderByBatchTimeDesc();

    @Query("SELECT b FROM ImportBatch b WHERE b.batchType = :batchType " +
           "AND b.batchTime BETWEEN :startTime AND :endTime ORDER BY b.batchTime ASC")
    List<ImportBatch> findByBatchTypeAndTimeRange(
            @Param("batchType") String batchType,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    @Query("SELECT b FROM ImportBatch b WHERE b.isDelayed = true ORDER BY b.batchTime DESC")
    List<ImportBatch> findDelayedBatches();

    @Query("SELECT COUNT(b) FROM ImportBatch b WHERE b.batchType = :batchType " +
           "AND b.batchTime >= :since")
    long countByBatchTypeAndTimeAfter(@Param("batchType") String batchType,
                                      @Param("since") LocalDateTime since);
}
