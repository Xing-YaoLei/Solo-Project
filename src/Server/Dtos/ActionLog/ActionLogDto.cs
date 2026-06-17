using SiteSchedule.Dtos.Common;
using SiteSchedule.Models;

namespace SiteSchedule.Dtos.ActionLog;

public class ActionLogDto
{
    public int Id { get; set; }
    public int SiteId { get; set; }
    public string SiteName { get; set; } = string.Empty;
    public int? TargetId { get; set; }
    public ActionTargetType TargetType { get; set; }
    public string TargetTypeText { get; set; } = string.Empty;
    public ActionType ActionType { get; set; }
    public string ActionTypeText { get; set; } = string.Empty;
    public string ActionTitle { get; set; } = string.Empty;
    public string? ActionDescription { get; set; }
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public string? OperatorName { get; set; }
    public string? OperatorRole { get; set; }
    public DateTime ActionTime { get; set; }
    public string? Remark { get; set; }
    public string? IpAddress { get; set; }
}

public class ActionLogQueryDto : PagedQuery
{
    public int? SiteId { get; set; }
    public ActionType? ActionType { get; set; }
    public ActionTargetType? TargetType { get; set; }
    public DateTime? ActionTimeFrom { get; set; }
    public DateTime? ActionTimeTo { get; set; }
    public string? OperatorName { get; set; }
}
