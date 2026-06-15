package com.trial.booking.controller;

import com.trial.booking.common.ApiResponse;
import com.trial.booking.entity.Attachment;
import com.trial.booking.security.SecurityUtils;
import com.trial.booking.service.AttachmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AttachmentController {

    private final AttachmentService attachmentService;

    @PostMapping("/appointments/{appointmentId}/attachments")
    public ApiResponse<Attachment> upload(
            @PathVariable Long appointmentId,
            @RequestParam("file") MultipartFile file) {
        Long userId = SecurityUtils.getCurrentUserId();
        return ApiResponse.success(attachmentService.upload(appointmentId, file, userId));
    }

    @GetMapping("/appointments/{appointmentId}/attachments")
    public ApiResponse<List<Attachment>> getByAppointmentId(@PathVariable Long appointmentId) {
        return ApiResponse.success(attachmentService.getByAppointmentId(appointmentId));
    }

    @GetMapping("/attachments/{id}/download")
    public ResponseEntity<Resource> download(@PathVariable Long id) {
        Attachment attachment = attachmentService.findById(id);
        Resource resource = attachmentService.download(id);
        String encodedFilename = URLEncoder.encode(attachment.getFileName(), StandardCharsets.UTF_8)
                .replace("+", "%20");
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + encodedFilename + "\"; filename*=UTF-8''" + encodedFilename)
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }

    @DeleteMapping("/attachments/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        attachmentService.delete(id);
        return ApiResponse.success();
    }
}
