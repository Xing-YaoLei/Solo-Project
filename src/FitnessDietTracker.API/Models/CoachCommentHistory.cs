namespace FitnessDietTracker.API.Models;

public class CoachCommentHistory
{
    public int Id { get; set; }
    public int CoachCommentId { get; set; }
    public CoachComment CoachComment { get; set; } = null!;
    public string OldValue { get; set; } = string.Empty;
    public string NewValue { get; set; } = string.Empty;
    public int ChangedBy { get; set; }
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
}
