using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CertSchedulePlatform.Entities;

public class ProgressAlert
{
    [Key]
    public int Id { get; set; }

    public int LearningProgressId { get; set; }

    [ForeignKey(nameof(LearningProgressId))]
    public LearningProgress? LearningProgress { get; set; }

    public int UserId { get; set; }

    [ForeignKey(nameof(UserId))]
    public User? User { get; set; }

    public AlertType AlertType { get; set; }

    public AlertSeverity Severity { get; set; }

    public decimal CurrentRate { get; set; }

    public decimal ExpectedRate { get; set; }

    public decimal BehindRate { get; set; }

    [MaxLength(500)]
    public string? Message { get; set; }

    public AlertStatus Status { get; set; } = AlertStatus.Open;

    [MaxLength(1000)]
    public string? Reason { get; set; }

    [MaxLength(1000)]
    public string? ActionTaken { get; set; }

    public DateTime? ResolvedAt { get; set; }

    public int? ResolvedByUserId { get; set; }

    [ForeignKey(nameof(ResolvedByUserId))]
    public User? ResolvedBy { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? ClosedAt { get; set; }
}

public enum AlertType
{
    ProgressBehind = 1,
    DeadlineApproaching = 2,
    NoActivity = 3,
    ScoreDrop = 4
}

public enum AlertSeverity
{
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4
}

public enum AlertStatus
{
    Open = 0,
    InProgress = 1,
    Resolved = 2,
    Closed = 3,
    Ignored = 4
}
