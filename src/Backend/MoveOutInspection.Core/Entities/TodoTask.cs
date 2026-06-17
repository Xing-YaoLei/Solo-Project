
using MoveOutInspection.Core.Enums;

namespace MoveOutInspection.Core.Entities;

public class TodoTask : EntityBase
{
    public string TaskNo { get; set; } = string.Empty;
    public Guid? MoveOutOrderId { get; set; }
    public MoveOutOrder? MoveOutOrder { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public TodoStatus Status { get; set; }
    public TodoPriority Priority { get; set; }
    public string? Category { get; set; }
    public Guid AssignedToId { get; set; }
    public Staff? AssignedTo { get; set; }
    public Guid? CreatedById { get; set; }
    public Staff? CreatedBy { get; set; }
    public DateTime DueDate { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? Result { get; set; }
    public ICollection<string>? AttachmentUrls { get; set; }
}
