package com.usedcar.scheduling.repository;

import com.usedcar.scheduling.domain.FinanceDocument;
import com.usedcar.scheduling.enums.DocumentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FinanceDocumentRepository extends JpaRepository<FinanceDocument, Long> {

    List<FinanceDocument> findByVehicleId(Long vehicleId);

    List<FinanceDocument> findByVehicleIdAndStatus(Long vehicleId, DocumentStatus status);

    List<FinanceDocument> findByUploaderId(Long uploaderId);

    List<FinanceDocument> findByStatus(DocumentStatus status);

    long countByVehicleIdAndStatus(Long vehicleId, DocumentStatus status);
}
