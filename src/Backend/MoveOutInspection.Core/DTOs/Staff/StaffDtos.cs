
using MoveOutInspection.Core.Enums;

namespace MoveOutInspection.Core.DTOs.Staff;

public class StaffDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string EmployeeId { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public RoleType Role { get; set; }
    public string Department { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class RepairDurationAnalysisDto
{
    public string Category { get; set; } = string.Empty;
    public int TotalRepairs { get; set; }
    public double AverageDurationHours { get; set; }
    public double MinDurationHours { get; set; }
    public double MaxDurationHours { get; set; }
    public decimal TotalActualCost { get; set; }
    public decimal AverageActualCost { get; set; }
}

public class RepairRecordDto
{
    public Guid Id { get; set; }
    public Guid MoveOutOrderId { get; set; }
    public string? OrderNumber { get; set; }
    public string? ApartmentNumber { get; set; }
    public Guid? InspectionRecordId { get; set; }
    public string RepairItem { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal EstimatedCost { get; set; }
    public decimal ActualCost { get; set; }
    public DateTime? ReportedAt { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int? DurationHours { get; set; }
    public string? AssignedToName { get; set; }
    public ResponsibilityParty Responsibility { get; set; }
    public string? Status { get; set; }
    public string? Remarks { get; set; }
    public ICollection<string>? PhotoUrls { get; set; }
}
