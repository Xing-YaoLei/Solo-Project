namespace FitnessDietTracker.API.Models;

public class InterruptionLog
{
    public int Id { get; set; }
    public int InterruptionId { get; set; }
    public CheckInInterruption Interruption { get; set; } = null!;
    public string ActionType { get; set; } = string.Empty;
    public string? Reason { get; set; }
    public string? ActionTaken { get; set; }
    public DateTime? ClosedAt { get; set; }
    public int? OperatorId { get; set; }
    public User? Operator { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? Remarks { get; set; }
}
