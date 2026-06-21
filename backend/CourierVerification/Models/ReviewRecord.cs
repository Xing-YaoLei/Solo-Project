namespace CourierVerification.Models;

public class ReviewRecord
{
    public Guid Id { get; set; }
    public Guid VerificationRecordId { get; set; }
    public string Reviewer { get; set; } = string.Empty;
    public DateTimeOffset ReviewedAt { get; set; }
    public string Findings { get; set; } = string.Empty;
    public string? ActionsTaken { get; set; }
    public string Conclusion { get; set; } = string.Empty;
    public bool FollowUpRequired { get; set; }
    public string? FollowUpNote { get; set; }

    public virtual VerificationRecord? VerificationRecord { get; set; }
}
