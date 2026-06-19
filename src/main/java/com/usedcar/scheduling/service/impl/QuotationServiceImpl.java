package com.usedcar.scheduling.service.impl;

import com.usedcar.scheduling.domain.QuotationHistory;
import com.usedcar.scheduling.dto.QuotationDTO;
import com.usedcar.scheduling.repository.QuotationHistoryRepository;
import com.usedcar.scheduling.service.QuotationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QuotationServiceImpl implements QuotationService {

    private final QuotationHistoryRepository quotationHistoryRepository;

    @Override
    public Page<QuotationHistory> findAll(Pageable pageable) {
        return quotationHistoryRepository.findAll(pageable);
    }

    @Override
    public List<QuotationHistory> findByVehicleId(Long vehicleId) {
        return quotationHistoryRepository.findByVehicleIdOrderByCreatedAtDesc(vehicleId);
    }

    @Override
    @Transactional
    public QuotationHistory create(QuotationHistory quotation) {
        return quotationHistoryRepository.save(quotation);
    }

    @Override
    public Page<QuotationHistory> search(Long vehicleId, LocalDateTime start, LocalDateTime end, Pageable pageable) {
        Specification<QuotationHistory> spec = Specification.where(null);
        if (vehicleId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("vehicle").get("id"), vehicleId));
        }
        if (start != null) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), start));
        }
        if (end != null) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("createdAt"), end));
        }
        return quotationHistoryRepository.findAll(spec, pageable);
    }

    @Override
    public QuotationDTO toDTO(QuotationHistory quotation) {
        QuotationDTO dto = new QuotationDTO();
        dto.setId(quotation.getId());
        dto.setVehicleId(quotation.getVehicle().getId());
        dto.setVehicleVin(quotation.getVehicle().getVin());
        dto.setVehicleInfo(quotation.getVehicle().getVin() + " - " + quotation.getVehicle().getBrand() + " " + quotation.getVehicle().getModel());
        dto.setQuotationPrice(quotation.getQuotationPrice());
        dto.setQuotationType(quotation.getQuotationType().name());
        dto.setOperatorName(quotation.getOperator() != null ? quotation.getOperator().getRealName() : null);
        dto.setCustomerName(quotation.getCustomerName());
        dto.setRemark(quotation.getRemark());
        dto.setCreatedAt(quotation.getCreatedAt());
        return dto;
    }
}
