package com.usedcar.scheduling.service;

import com.usedcar.scheduling.domain.FinanceDocument;
import com.usedcar.scheduling.dto.FinanceDocumentDTO;
import com.usedcar.scheduling.enums.DocumentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface FinanceDocumentService {

    Page<FinanceDocument> findAll(Pageable pageable);

    List<FinanceDocument> findByVehicleId(Long vehicleId);

    FinanceDocument upload(FinanceDocument document);

    FinanceDocument updateStatus(Long docId, DocumentStatus newStatus, Long operatorId, String remark);

    List<FinanceDocument> findMissingDocuments(Long vehicleId);

    FinanceDocumentDTO toDTO(FinanceDocument doc);
}
