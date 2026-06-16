using System.ComponentModel.DataAnnotations;
using ElderCare.Api.Models.Enums;

namespace ElderCare.Api.Models;

public class RiskEvent
{
    [Key]
    public int Id { get; set; }

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

    [Required, StringLength(20)]
    public string Status { get; set; } = "Open";

    [StringLength(500)]
    public string? Resolution { get; set; }

    public DateTime? ResolvedAt { get; set; }

    public ElderlyProfile Elderly { get; set; } = null!;
    public Area Area { get; set; } = null!;
    public Staff ReportedByStaff { get; set; } = null!;
    public Staff AssignedStaff { get; set; } = null!;
    public ICollection<RiskEventReminder> Reminders { get; set; } = new List<RiskEventReminder>();
}
