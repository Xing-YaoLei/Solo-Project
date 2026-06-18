package com.secondhand.funnel.service;

import com.secondhand.funnel.entity.QuotationHistory;

import java.util.List;

public interface QuotationHistoryService {
    QuotationHistory create(QuotationHistory quotation);
    QuotationHistory getById(Long id);
    List<QuotationHistory> getByCarId(Long carId);
    List<QuotationHistory> getByQuotedBy(Long quotedBy);
    QuotationHistory update(Long id, QuotationHistory quotation);
    void delete(Long id);
    List<QuotationHistory> listAll();
}
