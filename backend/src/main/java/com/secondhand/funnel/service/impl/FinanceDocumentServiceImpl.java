package com.secondhand.funnel.service.impl;

import com.secondhand.funnel.dto.DocumentMissingDTO;
import com.secondhand.funnel.entity.CarInventory;
import com.secondhand.funnel.entity.FinanceDocument;
import com.secondhand.funnel.entity.SysUser;
import com.secondhand.funnel.enums.DocType;
import com.secondhand.funnel.exception.BusinessException;
import com.secondhand.funnel.repository.CarInventoryRepository;
import com.secondhand.funnel.repository.FinanceDocumentRepository;
import com.secondhand.funnel.repository.SysUserRepository;
import com.secondhand.funnel.service.FinanceDocumentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FinanceDocumentServiceImpl implements FinanceDocumentService {

    private final FinanceDocumentRepository financeDocumentRepository;
    private final CarInventoryRepository carInventoryRepository;
    private final SysUserRepository sysUserRepository;

    @Override
    @Transactional
    public FinanceDocument create(FinanceDocument document) {
        if (document.getId() != null) {
            document.setId(null);
        }
        if (Boolean.FALSE.equals(document.getIsMissing()) && document.getUploadedAt() == null) {
            document.setUploadedAt(LocalDateTime.now());
        }
        FinanceDocument saved = financeDocumentRepository.save(document);
        log.info("创建金融资料成功: id={}, carId={}, docType={}", saved.getId(), saved.getCarId(), saved.getDocType());
        return saved;
    }

    @Override
    public FinanceDocument getById(Long id) {
        return financeDocumentRepository.findById(id)
                .orElseThrow(() -> new BusinessException("金融资料不存在: " + id));
    }

    @Override
    public List<FinanceDocument> getByCarId(Long carId) {
        return financeDocumentRepository.findByCarId(carId);
    }

    @Override
    public List<FinanceDocument> getMissingByCarId(Long carId) {
        return financeDocumentRepository.findByCarIdAndIsMissing(carId, true);
    }

    @Override
    @Transactional
    public FinanceDocument update(Long id, FinanceDocument document) {
        FinanceDocument existing = getById(id);
        existing.setDocType(document.getDocType());
        existing.setIsMissing(document.getIsMissing());
        existing.setMissingReason(document.getMissingReason());
        if (Boolean.FALSE.equals(document.getIsMissing()) && document.getUploadedAt() == null) {
            existing.setUploadedAt(LocalDateTime.now());
        } else {
            existing.setUploadedAt(document.getUploadedAt());
        }
        FinanceDocument updated = financeDocumentRepository.save(existing);
        log.info("更新金融资料成功: id={}", id);
        return updated;
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!financeDocumentRepository.existsById(id)) {
            throw new BusinessException("金融资料不存在: " + id);
        }
        financeDocumentRepository.deleteById(id);
        log.info("删除金融资料成功: id={}", id);
    }

    @Override
    public List<FinanceDocument> listAll() {
        return financeDocumentRepository.findAll();
    }

    @Override
    public long countMissingByCarId(Long carId) {
        return financeDocumentRepository.countByCarIdAndIsMissing(carId, true);
    }

    @Override
    public List<DocumentMissingDTO> getCarsWithMissingDocs() {
        List<Long> carIds = financeDocumentRepository.findCarIdsWithMissingDocs();
        if (carIds.isEmpty()) {
            return new ArrayList<>();
        }

        Map<Long, CarInventory> carMap = carInventoryRepository.findByIds(carIds).stream()
                .collect(Collectors.toMap(CarInventory::getId, c -> c));

        List<DocumentMissingDTO> result = new ArrayList<>();
        for (Long carId : carIds) {
            CarInventory car = carMap.get(carId);
            if (car == null) continue;

            List<FinanceDocument> missingDocs = getMissingByCarId(carId);
            String missingTypes = missingDocs.stream()
                    .map(d -> d.getDocType().name())
                    .collect(Collectors.joining(", "));

            DocumentMissingDTO dto = new DocumentMissingDTO();
            dto.setCarId(carId);
            dto.setCarVin(car.getCarVin());
            dto.setBrand(car.getBrand());
            dto.setModel(car.getModel());
            dto.setMissingCount((long) missingDocs.size());
            dto.setMissingDocs(missingTypes);
            result.add(dto);
        }
        return result;
    }

    @Override
    public boolean checkAllDocumentsComplete(Long carId) {
        long missingCount = countMissingByCarId(carId);
        DocType[] allTypes = DocType.values();
        List<FinanceDocument> docs = getByCarId(carId);
        return docs.size() >= allTypes.length && missingCount == 0;
    }

    @Override
    public FinanceDocument getByCarIdAndDocType(Long carId, DocType docType) {
        return financeDocumentRepository.findByCarIdAndDocType(carId, docType);
    }
}
