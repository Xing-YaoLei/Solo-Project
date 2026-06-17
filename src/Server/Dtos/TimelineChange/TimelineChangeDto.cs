using SiteSchedule.Dtos.Common;
using SiteSchedule.Models;

namespace SiteSchedule.Dtos.TimelineChange;

public class TimelineChangeDto
{
    public int Id { get; set; }
    public int SiteId { get; set; }
    public string SiteName { get; set; } = string.Empty;
    public ChangeType ChangeType { get; set; }
    public string ChangeTypeText { get; set; } = string.Empty;
    public string ChangeTitle { get; set; } = string.Empty;
    public string? ChangeDescription { get; set; }
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public DateTime? OldDate { get; set; }
    public DateTime? NewDate { get; set; }
    public string? OperatorName { get; set; }
    public string? OperatorRole { get; set; }
    public DateTime ChangeTime { get; set; }
    public string? Remark { get; set; }
}

public class TimelineChangeQueryDto : PagedQuery
{
    public int? SiteId { get; set; }
    public ChangeType? ChangeType { get; set; }
    public DateTime? ChangeTimeFrom { get; set; }
    public DateTime? ChangeTimeTo { get; set; }
    public string? OperatorName { get; set; }
}

public class TimelineChangeCreateDto
{
    public int SiteId { get; set; }
    public ChangeType ChangeType { get; set; }
    public string ChangeTitle { get; set; } = string.Empty;
    public string? ChangeDescription { get; set; }
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public DateTime? OldDate { get; set; }
    public DateTime? NewDate { get; set; }
    public string? OperatorName { get; set; }
    public string? OperatorRole { get; set; }
    public string? Remark { get; set; }
}
