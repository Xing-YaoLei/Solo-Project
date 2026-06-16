using Microsoft.EntityFrameworkCore;
using PrescriptionReview.Core.Common;
using PrescriptionReview.Core.Dtos;
using PrescriptionReview.Core.Interfaces;
using PrescriptionReview.Domain.Entities;
using PrescriptionReview.Domain.Enums;
using PrescriptionReview.Infrastructure.Data;

namespace PrescriptionReview.Infrastructure.Services;

public class AttachmentService : IAttachmentService
{
    private readonly AppDbContext _context;
    private readonly string _uploadPath;

    public AttachmentService(AppDbContext context)
    {
        _context = context;
        _uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
        if (!Directory.Exists(_uploadPath))
        {
            Directory.CreateDirectory(_uploadPath);
        }
    }

    public async Task<ApiResult<List<AttachmentDto>>> GetByPrescriptionIdAsync(int prescriptionId)
    {
        var attachments = await _context.Attachments
            .Include(a => a.Uploader)
            .Where(a => a.PrescriptionId == prescriptionId)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new AttachmentDto
            {
                Id = a.Id,
                Type = a.Type,
                TypeName = GetTypeName(a.Type),
                FileName = a.FileName,
                OriginalFileName = a.OriginalFileName,
                FilePath = a.FilePath,
                FileSize = a.FileSize,
                ContentType = a.ContentType,
                UploadedBy = a.UploadedBy,
                UploaderName = a.Uploader != null ? a.Uploader.RealName : null,
                CreatedAt = a.CreatedAt
            })
            .ToListAsync();

        return ApiResult<List<AttachmentDto>>.Ok(attachments);
    }

    public async Task<ApiResult<AttachmentDto>> UploadAsync(int prescriptionId, AttachmentType type, Stream fileStream, string fileName, string contentType, int uploadedBy)
    {
        var prescription = await _context.Prescriptions.FindAsync(prescriptionId);
        if (prescription == null)
        {
            return ApiResult<AttachmentDto>.Fail("处方不存在");
        }

        var fileExtension = Path.GetExtension(fileName);
        var newFileName = $"{Guid.NewGuid()}{fileExtension}";
        var relativePath = Path.Combine("uploads", newFileName).Replace("\\", "/");
        var fullPath = Path.Combine(_uploadPath, newFileName);

        using (var stream = new FileStream(fullPath, FileMode.Create))
        {
            await fileStream.CopyToAsync(stream);
        }

        var fileInfo = new FileInfo(fullPath);

        var attachment = new Attachment
        {
            PrescriptionId = prescriptionId,
            Type = type,
            FileName = newFileName,
            OriginalFileName = fileName,
            FilePath = relativePath,
            FileSize = fileInfo.Length,
            ContentType = contentType,
            UploadedBy = uploadedBy,
            CreatedAt = DateTime.Now
        };

        _context.Attachments.Add(attachment);
        await _context.SaveChangesAsync();

        var dto = new AttachmentDto
        {
            Id = attachment.Id,
            Type = attachment.Type,
            TypeName = GetTypeName(attachment.Type),
            FileName = attachment.FileName,
            OriginalFileName = attachment.OriginalFileName,
            FilePath = attachment.FilePath,
            FileSize = attachment.FileSize,
            ContentType = attachment.ContentType,
            UploadedBy = attachment.UploadedBy,
            CreatedAt = attachment.CreatedAt
        };

        return ApiResult<AttachmentDto>.Ok(dto, "上传成功");
    }

    public async Task<ApiResult> DeleteAsync(int id)
    {
        var attachment = await _context.Attachments.FindAsync(id);
        if (attachment == null)
        {
            return ApiResult.Fail("附件不存在");
        }

        var fullPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", attachment.FilePath);
        if (File.Exists(fullPath))
        {
            File.Delete(fullPath);
        }

        _context.Attachments.Remove(attachment);
        await _context.SaveChangesAsync();

        return ApiResult.Ok("删除成功");
    }

    private string GetTypeName(AttachmentType type)
    {
        return type switch
        {
            AttachmentType.PrescriptionPhoto => "处方照片",
            AttachmentType.SupplementDocument => "补充资料",
            AttachmentType.Other => "其他",
            _ => "未知"
        };
    }
}
