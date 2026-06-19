package com.usedcar.scheduling.service.impl;

import com.usedcar.scheduling.domain.FinanceDocument;
import com.usedcar.scheduling.dto.FinanceDocumentDTO;
import com.usedcar.scheduling.enums.DocumentStatus;
import com.usedcar.scheduling.repository.FinanceDocumentRepository;
import com.usedcar.scheduling.service.FinanceDocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FinanceDocumentServiceImpl implements FinanceDocumentService {

    private final FinanceDocumentRepository financeDocumentRepository;

    @Override
    public Page<FinanceDocument> findAll(Pageable pageable) {
        return financeDocumentRepository.findAll(pageable);
    }

    @Override
    public List<FinanceDocument> findByVehicleId(Long vehicleId) {
        return financeDocumentRepository.findByVehicleId(vehicleId);
    }

    @Override
    @Transactional
    public FinanceDocument upload(FinanceDocument document) {
        return financeDocumentRepository.save(document);
    }

    @Override
    @Transactional
    public FinanceDocument updateStatus(Long docId, DocumentStatus newStatus, Long operatorId, String remark) {
        FinanceDocument doc = financeDocumentRepository.findById(docId)
                .orElseThrow(() -> new IllegalArgumentException("文档不存在: " + docId));
        doc.setStatus(newStatus);
        doc.setRemark(remark);
        if (newStatus == DocumentStatus.APPROVED || newStatus == DocumentStatus.REJECTED) {
            doc.setReviewedAt(LocalDateTime.now());
        }
        return financeDocumentRepository.save(doc);
    }

    @Override
    public List<FinanceDocument> findMissingDocuments(Long vehicleId) {
        return financeDocumentRepository.findByVehicleIdAndStatus(vehicleId, DocumentStatus.MISSING);
    }

    @Override
    public FinanceDocumentDTO toDTO(FinanceDocument doc) {
        FinanceDocumentDTO dto = new FinanceDocumentDTO();
        dto.setId(doc.getId());
        dto.setVehicleId(doc.getVehicle().getId());
        dto.setVehicleVin(doc.getVehicle().getVin());
        dto.setVehicleInfo(doc.getVehicle().getVin() + " - " + doc.getVehicle().getBrand() + " " + doc.getVehicle().getModel());
        dto.setDocumentType(doc.getDocumentType().name());
        dto.setDocumentUrl(doc.getDocumentUrl());
        dto.setStatus(doc.getStatus().name());
        dto.setUploaderName(doc.getUploader() != null ? doc.getUploader().getRealName() : null);
        dto.setReviewedAt(doc.getReviewedAt());
        dto.setRemark(doc.getRemark());
        return dto;
    }
}
