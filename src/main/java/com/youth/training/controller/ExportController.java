package com.youth.training.controller;

import com.youth.training.service.ExportService;
import lombok.RequiredArgsConstructor;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletResponse;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api/export")
@RequiredArgsConstructor
public class ExportController {

    private final ExportService exportService;

    private static final DateTimeFormatter FILE_DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMddHHmm");

    @GetMapping("/progress")
    public ResponseEntity<byte[]> exportProgress(@RequestParam(required = false) List<Long> studentIds,
                                                  @RequestParam(required = false) List<Long> courseIds) throws IOException {
        XSSFWorkbook workbook = exportService.exportProgressReport(studentIds, courseIds);
        String fileName = "progress_report_" + LocalDateTime.now().format(FILE_DATE_FORMATTER) + ".xlsx";
        return buildExcelResponse(workbook, fileName);
    }

    @GetMapping("/renewal")
    public ResponseEntity<byte[]> exportRenewal(@RequestParam(required = false) List<Long> studentIds) throws IOException {
        XSSFWorkbook workbook = exportService.exportRenewalReport(studentIds);
        String fileName = "renewal_report_" + LocalDateTime.now().format(FILE_DATE_FORMATTER) + ".xlsx";
        return buildExcelResponse(workbook, fileName);
    }

    @GetMapping("/exception")
    public ResponseEntity<byte[]> exportException(@RequestParam(required = false) String status) throws IOException {
        XSSFWorkbook workbook = exportService.exportExceptionReport(status);
        String fileName = "exception_report_" + LocalDateTime.now().format(FILE_DATE_FORMATTER) + ".xlsx";
        return buildExcelResponse(workbook, fileName);
    }

    private ResponseEntity<byte[]> buildExcelResponse(XSSFWorkbook workbook, String fileName) throws IOException {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        workbook.write(outputStream);
        byte[] bytes = outputStream.toByteArray();
        workbook.close();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        String encodedFileName = URLEncoder.encode(fileName, StandardCharsets.UTF_8.name()).replaceAll("\\+", "%20");
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encodedFileName);
        headers.setContentLength(bytes.length);

        return ResponseEntity.ok()
                .headers(headers)
                .body(bytes);
    }
}
