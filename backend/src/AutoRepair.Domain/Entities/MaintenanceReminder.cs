namespace AutoRepair.Domain.Entities;

public enum ReminderStatus
{
    Pending = 0,
    Notified = 1,
    Completed = 2,
    Cancelled = 3
}

public class MaintenanceReminder
{
    public Guid Id { get; set; }
    public Guid VehicleId { get; set; }
    public string ReminderType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime ScheduledDate { get; set; }
    public int? TriggerMileage { get; set; }
    public ReminderStatus Status { get; set; }
    public DateTime? NotifiedAt { get; set; }
    public DateTime CreatedAt { get; set; }

    public Vehicle? Vehicle { get; set; }
}
