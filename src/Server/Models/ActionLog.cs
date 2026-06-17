using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SiteSchedule.Models;

public enum ActionType
{
    Submit = 1,
    Supplement = 2,
    Retry = 3,
    Close = 4,
    Approve = 5,
    Reject = 6,
    Assign = 7,
    Other = 99
}

public enum ActionTargetType
{
    Site = 1,
    Confirmation = 2,
    Material = 3,
    Notification = 4
}

public class ActionLog
{
    [Key]
    public int Id { get; set; }

    public int SiteId { get; set; }

    [ForeignKey(nameof(SiteId))]
    public virtual ConstructionSite Site { get; set; } = null!;

    public int? TargetId { get; set; }

    public ActionTargetType TargetType { get; set; }

    public ActionType ActionType { get; set; }

    [Required]
    [MaxLength(200)]
    public string ActionTitle { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? ActionDescription { get; set; }

    [MaxLength(500)]
    public string? OldValue { get; set; }

    [MaxLength(500)]
    public string? NewValue { get; set; }

    [MaxLength(50)]
    public string? OperatorName { get; set; }

    [MaxLength(50)]
    public string? OperatorRole { get; set; }

    public DateTime ActionTime { get; set; } = DateTime.Now;

    [MaxLength(500)]
    public string? Remark { get; set; }

    [MaxLength(500)]
    public string? IpAddress { get; set; }
}
