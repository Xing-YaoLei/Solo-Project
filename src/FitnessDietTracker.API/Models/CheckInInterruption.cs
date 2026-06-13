using FitnessDietTracker.API.Enums;

namespace FitnessDietTracker.API.Models;

public class CheckInInterruption
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int MissedDays { get; set; }
    public InterruptionStatus Status { get; set; }
    public string? Reason { get; set; }
    public string? ActionTaken { get; set; }
    public DateTime? ClosedAt { get; set; }
    public int? ClosedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<InterruptionLog> Logs { get; set; } = new List<InterruptionLog>();
}
