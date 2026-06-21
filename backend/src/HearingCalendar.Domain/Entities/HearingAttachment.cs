using HearingCalendar.Domain.Common;
using HearingCalendar.Domain.Enums;

namespace HearingCalendar.Domain.Entities;

public class HearingAttachment : BaseEntity
{
    public Guid HearingId { get; set; }
    public required string FileName { get; set; }
    public required string FilePath { get; set; }
    public required string FileType { get; set; }
    public long FileSize { get; set; }
    public AttachmentType AttachmentType { get; set; }
    public Guid UploadedBy { get; set; }
    public string? Description { get; set; }

    public HearingSchedule Hearing { get; set; } = null!;
}
