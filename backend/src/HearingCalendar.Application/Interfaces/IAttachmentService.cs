using HearingCalendar.Application.Dtos;
using HearingCalendar.Domain.Enums;

namespace HearingCalendar.Application.Interfaces;

public interface IAttachmentService
{
    Task<AttachmentResponse> UploadAsync(Guid hearingId, Stream fileStream, string fileName, long fileSize, string fileType, AttachmentType attachmentType, Guid userId, string? description = null);
    Task<(Stream Stream, string FileName, string ContentType)> DownloadAsync(Guid attachmentId);
    Task DeleteAsync(Guid attachmentId, Guid userId);
    Task<IEnumerable<AttachmentResponse>> GetByHearingAsync(Guid hearingId);
}
