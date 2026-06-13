namespace FitnessDietTracker.API.Models;

public class CoachComment
{
    public int Id { get; set; }
    public int DietRecordId { get; set; }
    public DietRecord DietRecord { get; set; } = null!;
    public int CoachId { get; set; }
    public User Coach { get; set; } = null!;
    public string Comment { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<CoachCommentHistory> Histories { get; set; } = new List<CoachCommentHistory>();
}
