package com.secondhand.funnel.service.impl;

import com.secondhand.funnel.entity.QuotationHistory;
import com.secondhand.funnel.exception.BusinessException;
import com.secondhand.funnel.repository.QuotationHistoryRepository;
import com.secondhand.funnel.service.QuotationHistoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuotationHistoryServiceImpl implements QuotationHistoryService {

    private final QuotationHistoryRepository quotationHistoryRepository;

    @Override
    @Transactional
    public QuotationHistory create(QuotationHistory quotation) {
        if (quotation.getId() != null) {
            quotation.setId(null);
        }
        if (quotation.getValidDays() == null) {
            quotation.setValidDays(7);
        }
        QuotationHistory saved = quotationHistoryRepository.save(quotation);
        log.info("创建报价历史成功: id={}, carId={}, price={}", saved.getId(), saved.getCarId(), saved.getPrice());
        return saved;
    }

    @Override
    public QuotationHistory getById(Long id) {
        return quotationHistoryRepository.findById(id)
                .orElseThrow(() -> new BusinessException("报价记录不存在: " + id));
    }

    @Override
    public List<QuotationHistory> getByCarId(Long carId) {
        return quotationHistoryRepository.findByCarIdOrderByQuotedAtDesc(carId);
    }

    @Override
    public List<QuotationHistory> getByQuotedBy(Long quotedBy) {
        return quotationHistoryRepository.findByQuotedBy(quotedBy);
    }

    @Override
    @Transactional
    public QuotationHistory update(Long id, QuotationHistory quotation) {
        QuotationHistory existing = getById(id);
        existing.setPrice(quotation.getPrice());
        existing.setQuotedBy(quotation.getQuotedBy());
        existing.setValidDays(quotation.getValidDays());
        QuotationHistory updated = quotationHistoryRepository.save(existing);
        log.info("更新报价历史成功: id={}", id);
        return updated;
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!quotationHistoryRepository.existsById(id)) {
            throw new BusinessException("报价记录不存在: " + id);
        }
        quotationHistoryRepository.deleteById(id);
        log.info("删除报价历史成功: id={}", id);
    }

    @Override
    public List<QuotationHistory> listAll() {
        return quotationHistoryRepository.findAll();
    }
}
