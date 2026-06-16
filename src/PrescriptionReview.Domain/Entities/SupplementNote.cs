namespace PrescriptionReview.Domain.Entities;

public class SupplementNote
{
    public int Id { get; set; }
    public int PrescriptionId { get; set; }
    public Prescription? Prescription { get; set; }
    public int OperatorId { get; set; }
    public User? Operator { get; set; }
    public string Content { get; set; } = string.Empty;
    public string Source { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.Now;
}
