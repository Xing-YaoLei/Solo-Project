package com.secondhand.funnel.repository;

import com.secondhand.funnel.entity.FinanceDocument;
import com.secondhand.funnel.enums.DocType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FinanceDocumentRepository extends JpaRepository<FinanceDocument, Long> {
    List<FinanceDocument> findByCarId(Long carId);
    List<FinanceDocument> findByCarIdAndIsMissing(Long carId, Boolean isMissing);
    long countByCarIdAndIsMissing(Long carId, Boolean isMissing);

    @Query("SELECT DISTINCT f.carId FROM FinanceDocument f WHERE f.isMissing = true")
    List<Long> findCarIdsWithMissingDocs();

    @Query("SELECT f FROM FinanceDocument f WHERE f.carId = :carId AND f.docType = :docType")
    FinanceDocument findByCarIdAndDocType(@Param("carId") Long carId, @Param("docType") DocType docType);
}
