using PrescriptionReview.Domain.Enums;

namespace PrescriptionReview.Domain.Entities;

public class AuditLog
{
    public int Id { get; set; }
    public int PrescriptionId { get; set; }
    public Prescription? Prescription { get; set; }
    public int OperatorId { get; set; }
    public User? Operator { get; set; }
    public PrescriptionStatus OldStatus { get; set; }
    public PrescriptionStatus NewStatus { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? Remark { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.Now;
}
