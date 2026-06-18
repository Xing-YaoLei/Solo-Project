package com.secondhand.funnel.service;

import com.secondhand.funnel.dto.DocumentMissingDTO;
import com.secondhand.funnel.entity.FinanceDocument;
import com.secondhand.funnel.enums.DocType;

import java.util.List;

public interface FinanceDocumentService {
    FinanceDocument create(FinanceDocument document);
    FinanceDocument getById(Long id);
    List<FinanceDocument> getByCarId(Long carId);
    List<FinanceDocument> getMissingByCarId(Long carId);
    FinanceDocument update(Long id, FinanceDocument document);
    void delete(Long id);
    List<FinanceDocument> listAll();
    long countMissingByCarId(Long carId);
    List<DocumentMissingDTO> getCarsWithMissingDocs();
    boolean checkAllDocumentsComplete(Long carId);
    FinanceDocument getByCarIdAndDocType(Long carId, DocType docType);
}
