using System.ComponentModel.DataAnnotations;
using ElderCare.Api.Models.Enums;

namespace ElderCare.Api.DTOs;

public class CreateRiskEventDto
{
    [Required]
    public int ElderlyId { get; set; }

    [Required]
    public RiskEventType EventType { get; set; }

    [Required]
    public RiskEventSeverity Severity { get; set; }

    [Required, StringLength(1000)]
    public string Description { get; set; } = string.Empty;

    [Required]
    public DateTime EventTime { get; set; }

    [StringLength(200)]
    public string? Location { get; set; }

    [Required]
    public int AreaId { get; set; }

    [Required]
    public int ReportedByStaffId { get; set; }

    [Required]
    public int AssignedStaffId { get; set; }
}

public class UpdateRiskEventDto
{
    [Required]
    public RiskEventType EventType { get; set; }

    [Required]
    public RiskEventSeverity Severity { get; set; }

    [Required, StringLength(1000)]
    public string Description { get; set; } = string.Empty;

    [Required]
    public DateTime EventTime { get; set; }

    [StringLength(200)]
    public string? Location { get; set; }

    [Required]
    public int AreaId { get; set; }

    [Required]
    public int ReportedByStaffId { get; set; }

    [Required]
    public int AssignedStaffId { get; set; }

    [Required, StringLength(20)]
    public string Status { get; set; } = "Open";

    [StringLength(500)]
    public string? Resolution { get; set; }

    public DateTime? ResolvedAt { get; set; }
}

public class RiskEventDto
{
    public int Id { get; set; }
    public int ElderlyId { get; set; }
    public string ElderlyName { get; set; } = string.Empty;
    public string EventType { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime EventTime { get; set; }
    public string? Location { get; set; }
    public int AreaId { get; set; }
    public string AreaName { get; set; } = string.Empty;
    public int ReportedByStaffId { get; set; }
    public string ReportedByStaffName { get; set; } = string.Empty;
    public int AssignedStaffId { get; set; }
    public string AssignedStaffName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Resolution { get; set; }
    public DateTime? ResolvedAt { get; set; }
}

public class CreateReminderActionDto
{
    [Required, StringLength(1000)]
    public string Message { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Notes { get; set; }
}

public class ReminderActionDto
{
    public int Id { get; set; }
    public int RiskEventId { get; set; }
    public string ActionType { get; set; } = string.Empty;
    public int StaffId { get; set; }
    public string StaffName { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public DateTime ActionTime { get; set; }
    public bool IsSuccessful { get; set; }
    public int RetryCount { get; set; }
    public int? ParentReminderId { get; set; }
    public string? Notes { get; set; }
}

public class RiskEventTimelineDto
{
    public RiskEventDto RiskEvent { get; set; } = null!;
    public List<ReminderActionDto> Reminders { get; set; } = new();
}
