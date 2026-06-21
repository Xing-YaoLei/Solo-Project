using HearingCalendar.Domain.Enums;

namespace HearingCalendar.Application.Dtos;

public record AttachmentResponse(
    Guid Id,
    Guid HearingId,
    string FileName,
    string FilePath,
    string FileType,
    long FileSize,
    AttachmentType AttachmentType,
    Guid UploadedBy,
    string? Description,
    DateTime CreatedAt);

public record UploadAttachmentRequest(
    Guid HearingId,
    AttachmentType AttachmentType,
    string? Description);
