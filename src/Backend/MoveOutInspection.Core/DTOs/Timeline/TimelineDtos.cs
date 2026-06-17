
using MoveOutInspection.Core.Enums;

namespace MoveOutInspection.Core.DTOs.Timeline;

public class TimelineEventDto
{
    public Guid Id { get; set; }
    public TimelineEventType EventType { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? PreviousValue { get; set; }
    public string? NewValue { get; set; }
    public string? Notes { get; set; }
    public ICollection<string>? AttachmentUrls { get; set; }
    public Guid? ActorId { get; set; }
    public string? ActorName { get; set; }
    public DateTime EventTime { get; set; }
    public string? ReferenceId { get; set; }
    public string? ReferenceType { get; set; }
}

public class CreateTimelineNoteDto
{
    public Guid MoveOutOrderId { get; set; }
    public string Notes { get; set; } = string.Empty;
    public ICollection<string>? AttachmentUrls { get; set; }
}
