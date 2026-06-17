
using MoveOutInspection.Core.Enums;

namespace MoveOutInspection.Core.DTOs.Payment;

public class PaymentRecordDto
{
    public Guid Id { get; set; }
    public string TransactionNo { get; set; } = string.Empty;
    public PaymentType PaymentType { get; set; }
    public PaymentMethod PaymentMethod { get; set; }
    public decimal Amount { get; set; }
    public DateTime PaymentDate { get; set; }
    public string? PayerName { get; set; }
    public string? PayeeName { get; set; }
    public string? ReferenceNo { get; set; }
    public string? VoucherUrl { get; set; }
    public string? Remarks { get; set; }
    public string? RecordedByName { get; set; }
    public bool IsReconciled { get; set; }
    public DateTime? ReconciledAt { get; set; }
}

public class CreatePaymentRecordDto
{
    public Guid MoveOutOrderId { get; set; }
    public PaymentType PaymentType { get; set; }
    public PaymentMethod PaymentMethod { get; set; }
    public decimal Amount { get; set; }
    public DateTime PaymentDate { get; set; }
    public string? PayerName { get; set; }
    public string? PayeeName { get; set; }
    public string? ReferenceNo { get; set; }
    public string? VoucherUrl { get; set; }
    public string? Remarks { get; set; }
}

public class PaymentSummaryDto
{
    public Guid MoveOutOrderId { get; set; }
    public List<PaymentRecordDto> Records { get; set; } = new();
    public decimal TotalReceived { get; set; }
    public decimal TotalRefunded { get; set; }
    public decimal TotalCompensation { get; set; }
    public decimal NetAmount { get; set; }
}
