using HearingCalendar.Application.Dtos;
using HearingCalendar.Application.Interfaces;
using HearingCalendar.Domain.Entities;
using HearingCalendar.Domain.Enums;
using HearingCalendar.Infrastructure.Repositories;

namespace HearingCalendar.Application.Services;

public class AttachmentService : IAttachmentService
{
    private readonly IRepository<HearingAttachment> _attachmentRepo;
    private readonly AuditTrailRepository _auditTrailRepo;
    private readonly string _uploadBasePath = Path.Combine(Directory.GetCurrentDirectory(), "uploads");

    public AttachmentService(
        IRepository<HearingAttachment> attachmentRepo,
        AuditTrailRepository auditTrailRepo)
    {
        _attachmentRepo = attachmentRepo;
        _auditTrailRepo = auditTrailRepo;
    }

    public async Task<AttachmentResponse> UploadAsync(Guid hearingId, Stream fileStream, string fileName, long fileSize, string fileType, AttachmentType attachmentType, Guid userId, string? description = null)
    {
        var hearingDir = Path.Combine(_uploadBasePath, hearingId.ToString());
        Directory.CreateDirectory(hearingDir);

        var filePath = Path.Combine(hearingDir, fileName);
        using (var fs = new FileStream(filePath, FileMode.Create))
        {
            await fileStream.CopyToAsync(fs);
        }

        var attachment = new HearingAttachment
        {
            HearingId = hearingId,
            FileName = fileName,
            FilePath = filePath,
            FileType = fileType,
            FileSize = fileSize,
            AttachmentType = attachmentType,
            UploadedBy = userId,
            Description = description,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var created = await _attachmentRepo.AddAsync(attachment);
        await _auditTrailRepo.LogAsync(nameof(HearingAttachment), created.Id, "Upload", userId);

        return MapToResponse(created);
    }

    public async Task<(Stream Stream, string FileName, string ContentType)> DownloadAsync(Guid attachmentId)
    {
        var attachment = await _attachmentRepo.GetByIdAsync(attachmentId);
        if (attachment is null)
            throw new KeyNotFoundException($"Attachment {attachmentId} not found");

        if (!File.Exists(attachment.FilePath))
            throw new FileNotFoundException($"File not found at {attachment.FilePath}");

        var stream = new FileStream(attachment.FilePath, FileMode.Open, FileAccess.Read);
        return (stream, attachment.FileName, attachment.FileType);
    }

    public async Task DeleteAsync(Guid attachmentId, Guid userId)
    {
        var attachment = await _attachmentRepo.GetByIdAsync(attachmentId);
        if (attachment is null)
            throw new KeyNotFoundException($"Attachment {attachmentId} not found");

        if (File.Exists(attachment.FilePath))
            File.Delete(attachment.FilePath);

        await _attachmentRepo.DeleteAsync(attachmentId);
        await _auditTrailRepo.LogAsync(nameof(HearingAttachment), attachmentId, "Delete", userId);
    }

    public async Task<IEnumerable<AttachmentResponse>> GetByHearingAsync(Guid hearingId)
    {
        var attachments = await _attachmentRepo.FindAsync(a => a.HearingId == hearingId);
        return attachments.Select(MapToResponse);
    }

    private static AttachmentResponse MapToResponse(HearingAttachment a)
    {
        return new AttachmentResponse(
            a.Id, a.HearingId, a.FileName, a.FilePath, a.FileType,
            a.FileSize, a.AttachmentType, a.UploadedBy, a.Description, a.CreatedAt);
    }
}
