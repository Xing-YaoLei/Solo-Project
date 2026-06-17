using SiteSchedule.Models;

namespace SiteSchedule.Dtos.ActionLog;

public class ActionLogCreateDto
{
    public int SiteId { get; set; }
    public int? TargetId { get; set; }
    public ActionTargetType TargetType { get; set; }
    public ActionType ActionType { get; set; }
    public string ActionTitle { get; set; } = string.Empty;
    public string? ActionDescription { get; set; }
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public string? OperatorName { get; set; }
    public string? OperatorRole { get; set; }
    public string? Remark { get; set; }
    public string? IpAddress { get; set; }
}
