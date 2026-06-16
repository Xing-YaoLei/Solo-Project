namespace PrescriptionReview.Domain.Entities;

public class FollowUp
{
    public int Id { get; set; }
    public int PrescriptionId { get; set; }
    public Prescription? Prescription { get; set; }
    public int OperatorId { get; set; }
    public User? Operator { get; set; }
    public string Content { get; set; } = string.Empty;
    public string Result { get; set; } = string.Empty;
    public bool IsCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? Remark { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public DateTime? UpdatedAt { get; set; }
}
