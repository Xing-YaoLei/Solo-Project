package com.trial.booking.service;

import com.trial.booking.entity.Attachment;
import com.trial.booking.repository.AttachmentRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AttachmentService {

    private final AttachmentRepository attachmentRepository;

    @Value("${file.upload-dir}")
    private String uploadDir;

    public Attachment upload(Long appointmentId, MultipartFile file, Long userId) {
        try {
            Path dir = Paths.get(uploadDir);
            if (!Files.exists(dir)) {
                Files.createDirectories(dir);
            }
            String originalFilename = file.getOriginalFilename();
            String storedName = UUID.randomUUID() + "_" + originalFilename;
            Path targetPath = dir.resolve(storedName);
            file.transferTo(targetPath.toFile());

            Attachment attachment = new Attachment();
            attachment.setAppointmentId(appointmentId);
            attachment.setFileName(originalFilename);
            attachment.setFilePath(targetPath.toString());
            attachment.setFileType(file.getContentType());
            attachment.setFileSize(file.getSize());
            attachment.setUploadedBy(userId);
            return attachmentRepository.save(attachment);
        } catch (IOException e) {
            throw new RuntimeException("文件上传失败", e);
        }
    }

    public List<Attachment> getByAppointmentId(Long appointmentId) {
        return attachmentRepository.findByAppointmentIdOrderByCreatedAtDesc(appointmentId);
    }

    public Attachment findById(Long id) {
        return attachmentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("附件不存在"));
    }

    public Resource download(Long id) {
        Attachment attachment = findById(id);
        try {
            Path path = Paths.get(attachment.getFilePath());
            Resource resource = new UrlResource(path.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new RuntimeException("文件不存在或不可读");
            }
            return resource;
        } catch (IOException e) {
            throw new RuntimeException("文件下载失败", e);
        }
    }

    public void delete(Long id) {
        Attachment attachment = findById(id);
        try {
            Files.deleteIfExists(Paths.get(attachment.getFilePath()));
        } catch (IOException ignored) {
        }
        attachmentRepository.delete(attachment);
    }
}
