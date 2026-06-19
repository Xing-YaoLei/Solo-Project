package com.usedcar.scheduling.service;

import com.usedcar.scheduling.domain.QuotationHistory;
import com.usedcar.scheduling.dto.QuotationDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

public interface QuotationService {

    List<QuotationHistory> findByVehicleId(Long vehicleId);

    QuotationHistory create(QuotationHistory quotation);

    Page<QuotationHistory> search(Long vehicleId, LocalDateTime start, LocalDateTime end, Pageable pageable);

    QuotationDTO toDTO(QuotationHistory quotation);
}
