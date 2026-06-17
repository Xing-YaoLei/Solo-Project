
using MoveOutInspection.Core.Enums;

namespace MoveOutInspection.Core.Entities;

public class TimelineEvent : EntityBase
{
    public Guid MoveOutOrderId { get; set; }
    public MoveOutOrder? MoveOutOrder { get; set; }
    public TimelineEventType EventType { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? PreviousValue { get; set; }
    public string? NewValue { get; set; }
    public string? Notes { get; set; }
    public ICollection<string>? AttachmentUrls { get; set; }
    public Guid? ActorId { get; set; }
    public Staff? Actor { get; set; }
    public string? ActorName { get; set; }
    public DateTime EventTime { get; set; }
    public string? ReferenceId { get; set; }
    public string? ReferenceType { get; set; }
}
