
using MoveOutInspection.Core.Enums;

namespace MoveOutInspection.Core.DTOs.Todo;

public class TodoTaskDto
{
    public Guid Id { get; set; }
    public string TaskNo { get; set; } = string.Empty;
    public Guid? MoveOutOrderId { get; set; }
    public string? OrderNumber { get; set; }
    public string? ApartmentNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public TodoStatus Status { get; set; }
    public TodoPriority Priority { get; set; }
    public string? Category { get; set; }
    public Guid AssignedToId { get; set; }
    public string? AssignedToName { get; set; }
    public string? CreatedByName { get; set; }
    public DateTime DueDate { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? Result { get; set; }
    public ICollection<string>? AttachmentUrls { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateTodoTaskDto
{
    public Guid? MoveOutOrderId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public TodoPriority Priority { get; set; } = TodoPriority.Medium;
    public string? Category { get; set; }
    public Guid AssignedToId { get; set; }
    public DateTime DueDate { get; set; }
    public ICollection<string>? AttachmentUrls { get; set; }
}

public class UpdateTodoTaskDto
{
    public TodoStatus? Status { get; set; }
    public string? Description { get; set; }
    public DateTime? DueDate { get; set; }
    public string? Result { get; set; }
    public ICollection<string>? AttachmentUrls { get; set; }
}

public class TodoQueryDto : PagedQuery
{
    public TodoStatus? Status { get; set; }
    public TodoPriority? Priority { get; set; }
    public Guid? AssignedToId { get; set; }
    public DateTime? DueDateFrom { get; set; }
    public DateTime? DueDateTo { get; set; }
}

public class TodoStatusDto
{
    public TodoStatus Status { get; set; }
}
