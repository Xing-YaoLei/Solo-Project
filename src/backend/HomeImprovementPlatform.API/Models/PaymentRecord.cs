using HomeImprovementPlatform.API.Enums;

namespace HomeImprovementPlatform.API.Models;

public class PaymentRecord
{
    public Guid Id { get; set; }
    public string PaymentNumber { get; set; } = string.Empty;
    public string PaymentType { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    public string? TransactionId { get; set; }
    public string? PaymentMethod { get; set; }
    public DateTime? PaymentDate { get; set; }
    public string? Remarks { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Guid ProjectId { get; set; }
    public virtual Project? Project { get; set; }
    public Guid? DocumentId { get; set; }
    public virtual Document? Document { get; set; }
    public Guid RecordedById { get; set; }
    public virtual ApplicationUser? RecordedBy { get; set; }
}
