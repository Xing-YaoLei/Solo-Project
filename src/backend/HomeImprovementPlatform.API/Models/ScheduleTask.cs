using HomeImprovementPlatform.API.Enums;

namespace HomeImprovementPlatform.API.Models;

public class ScheduleTask
{
    public Guid Id { get; set; }
    public string TaskName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int ProgressPercent { get; set; } = 0;
    public DocumentStatus Status { get; set; } = DocumentStatus.Draft;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Guid ProjectId { get; set; }
    public virtual Project? Project { get; set; }
    public Guid? AssignedToId { get; set; }
    public virtual ApplicationUser? AssignedTo { get; set; }
}
