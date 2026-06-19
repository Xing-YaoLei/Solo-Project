package com.usedcar.scheduling.service;

import com.usedcar.scheduling.domain.FinanceDocument;
import com.usedcar.scheduling.dto.FinanceDocumentDTO;
import com.usedcar.scheduling.enums.DocumentStatus;

import java.util.List;

public interface FinanceDocumentService {

    List<FinanceDocument> findByVehicleId(Long vehicleId);

    FinanceDocument upload(FinanceDocument document);

    FinanceDocument updateStatus(Long docId, DocumentStatus newStatus, Long operatorId, String remark);

    List<FinanceDocument> findMissingDocuments(Long vehicleId);

    FinanceDocumentDTO toDTO(FinanceDocument doc);
}
