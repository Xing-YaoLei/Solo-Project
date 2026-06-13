namespace FitnessDietTracker.API.Dtos;

public class CoachCommentCreateDto
{
    public int DietRecordId { get; set; }
    public int CoachId { get; set; }
    public string Comment { get; set; } = string.Empty;
}

public class CoachCommentUpdateDto
{
    public string Comment { get; set; } = string.Empty;
}

public class CoachCommentHistoryDto
{
    public int Id { get; set; }
    public string OldValue { get; set; } = string.Empty;
    public string NewValue { get; set; } = string.Empty;
    public int ChangedBy { get; set; }
    public string ChangedByName { get; set; } = string.Empty;
    public DateTime ChangedAt { get; set; }
}
