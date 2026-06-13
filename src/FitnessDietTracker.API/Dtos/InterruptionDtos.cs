using FitnessDietTracker.API.Enums;

namespace FitnessDietTracker.API.Dtos;

public class CheckInInterruptionDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public int? CoachId { get; set; }
    public string? CoachName { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int MissedDays { get; set; }
    public InterruptionStatus Status { get; set; }
    public string? Reason { get; set; }
    public string? ActionTaken { get; set; }
    public DateTime? ClosedAt { get; set; }
    public int? ClosedBy { get; set; }
    public List<InterruptionLogDto> Logs { get; set; } = new();
}

public class HandleInterruptionDto
{
    public int OperatorId { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string ActionTaken { get; set; } = string.Empty;
    public InterruptionStatus? NewStatus { get; set; }
    public string? Remarks { get; set; }
}

public class InterruptionLogDto
{
    public int Id { get; set; }
    public string ActionType { get; set; } = string.Empty;
    public string? Reason { get; set; }
    public string? ActionTaken { get; set; }
    public DateTime? ClosedAt { get; set; }
    public int? OperatorId { get; set; }
    public string OperatorName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string? Remarks { get; set; }
}
