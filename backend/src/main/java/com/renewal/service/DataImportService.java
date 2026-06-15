package com.renewal.service;

import com.renewal.dto.DataImportRequest;
import com.renewal.dto.DataImportResultDTO;

public interface DataImportService {

    DataImportResultDTO importAndClean(DataImportRequest request);
}
