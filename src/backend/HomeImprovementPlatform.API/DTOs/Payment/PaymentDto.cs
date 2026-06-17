using HomeImprovementPlatform.API.Enums;

namespace HomeImprovementPlatform.API.DTOs.Payment;

public class PaymentRecordDto
{
    public Guid Id { get; set; }
    public string PaymentNumber { get; set; } = string.Empty;
    public string PaymentType { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public PaymentStatus Status { get; set; }
    public string? TransactionId { get; set; }
    public string? PaymentMethod { get; set; }
    public DateTime? PaymentDate { get; set; }
    public string? Remarks { get; set; }
    public DateTime CreatedAt { get; set; }
    
    public string ProjectName { get; set; } = string.Empty;
    public Guid ProjectId { get; set; }
    public string? DocumentNumber { get; set; }
    public Guid? DocumentId { get; set; }
    public string RecordedByName { get; set; } = string.Empty;
    public Guid RecordedById { get; set; }
}

public class CreatePaymentDto
{
    public string PaymentType { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string? TransactionId { get; set; }
    public string? PaymentMethod { get; set; }
    public DateTime? PaymentDate { get; set; }
    public string? Remarks { get; set; }
    public Guid ProjectId { get; set; }
    public Guid? DocumentId { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Paid;
}

public class UpdatePaymentDto
{
    public string PaymentType { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public PaymentStatus Status { get; set; }
    public string? TransactionId { get; set; }
    public string? PaymentMethod { get; set; }
    public DateTime? PaymentDate { get; set; }
    public string? Remarks { get; set; }
}
