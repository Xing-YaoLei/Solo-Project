using CertSchedulePlatform.Entities;

namespace CertSchedulePlatform.DTOs;

public class ProgressAlertDto
{
    public int Id { get; set; }
    public int LearningProgressId { get; set; }
    public int UserId { get; set; }
    public string? UserName { get; set; }
    public string? CertificateName { get; set; }
    public string? CourseName { get; set; }
    public AlertType AlertType { get; set; }
    public string? AlertTypeText { get; set; }
    public AlertSeverity Severity { get; set; }
    public string? SeverityText { get; set; }
    public decimal CurrentRate { get; set; }
    public decimal ExpectedRate { get; set; }
    public decimal BehindRate { get; set; }
    public string? Message { get; set; }
    public AlertStatus Status { get; set; }
    public string? StatusText { get; set; }
    public string? Reason { get; set; }
    public string? ActionTaken { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public int? ResolvedByUserId { get; set; }
    public string? ResolvedByName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
}

public class AlertHandleDto
{
    public string Reason { get; set; } = string.Empty;
    public string ActionTaken { get; set; } = string.Empty;
    public int HandlerUserId { get; set; }
    public AlertStatus NewStatus { get; set; }
}

public class AlertQueryDto
{
    public int? UserId { get; set; }
    public AlertStatus? Status { get; set; }
    public AlertSeverity? Severity { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int PageIndex { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}
