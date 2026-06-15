package com.renewal.controller;

import com.renewal.dto.DataImportRequest;
import com.renewal.dto.DataImportResultDTO;
import com.renewal.service.DataImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/data-import")
@RequiredArgsConstructor
public class DataImportController {

    private final DataImportService dataImportService;

    @PostMapping
    public ResponseEntity<DataImportResultDTO> importData(@RequestBody DataImportRequest request) {
        DataImportResultDTO result = dataImportService.importAndClean(request);
        return ResponseEntity.ok(result);
    }
}
