namespace AutoRepair.Domain.Entities;

public enum WorkOrderStatus
{
    Pending = 0,
    InProgress = 1,
    Completed = 2,
    Cancelled = 3,
    Rework = 4
}

public class WorkOrder
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public Guid VehicleId { get; set; }
    public string? AssignedToUserId { get; set; }
    public WorkOrderStatus Status { get; set; }
    public string? Description { get; set; }
    public DateTime ScheduledDate { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public bool IsRework { get; set; }
    public Guid? OriginalOrderId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public Vehicle? Vehicle { get; set; }
    public AppUser? AssignedToUser { get; set; }
    public WorkOrder? OriginalOrder { get; set; }
    public ICollection<WorkOrderItem> Items { get; set; } = new List<WorkOrderItem>();
    public ICollection<Diagnosis> Diagnoses { get; set; } = new List<Diagnosis>();
    public ICollection<Quote> Quotes { get; set; } = new List<Quote>();
}
