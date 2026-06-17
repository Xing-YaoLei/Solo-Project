
using MoveOutInspection.Core.Enums;

namespace MoveOutInspection.Core.Entities;

public class Staff : EntityBase
{
    public string Name { get; set; } = string.Empty;
    public string EmployeeId { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public RoleType Role { get; set; }
    public string Department { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    public ICollection<MoveOutOrder> AssignedOrders { get; set; } = new List<MoveOutOrder>();
    public ICollection<TodoTask> AssignedTodos { get; set; } = new List<TodoTask>();
    public ICollection<TimelineEvent> TimelineEvents { get; set; } = new List<TimelineEvent>();
}
