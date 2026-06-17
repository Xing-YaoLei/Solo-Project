
using MoveOutInspection.Core.Enums;

namespace MoveOutInspection.Core.Entities;

public class PaymentRecord : EntityBase
{
    public Guid MoveOutOrderId { get; set; }
    public MoveOutOrder? MoveOutOrder { get; set; }
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
    public Guid RecordedById { get; set; }
    public Staff? RecordedBy { get; set; }
    public bool IsReconciled { get; set; }
    public DateTime? ReconciledAt { get; set; }
}
