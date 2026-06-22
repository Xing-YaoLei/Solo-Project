using LegalFeeScheduling.Domain.Enums;

namespace LegalFeeScheduling.Domain.DTOs;

public class QuoteDetailDto
{
    public Guid Id { get; set; }

    public string QuoteNo { get; set; } = string.Empty;

    public string CaseName { get; set; } = string.Empty;

    public string ClientName { get; set; } = string.Empty;

    public Channel Channel { get; set; }

    public decimal Amount { get; set; }

    public decimal DiscountAmount { get; set; }

    public decimal FinalAmount { get; set; }

    public QuoteStatus Status { get; set; }

    public DateTime CreatedAt { get; set; }

    public string CreatedBy { get; set; } = string.Empty;

    public DateTime? ApprovedAt { get; set; }

    public string? ApprovedBy { get; set; }

    public DateTime? CompletedAt { get; set; }

    public DateTime? ClosedAt { get; set; }

    public string? Remarks { get; set; }

    public DateTime? ExpectedPaymentDate { get; set; }

    public string? Owner { get; set; }

    public ICollection<QuoteItemDetailDto> Items { get; set; } = new List<QuoteItemDetailDto>();

    public ICollection<PaymentDetailDto> Payments { get; set; } = new List<PaymentDetailDto>();

    public ICollection<ReconciliationDetailDto> Reconciliations { get; set; } = new List<ReconciliationDetailDto>();

    public ICollection<StatusHistoryDto> StatusHistories { get; set; } = new List<StatusHistoryDto>();
}

public class QuoteItemDetailDto
{
    public Guid Id { get; set; }

    public string ItemName { get; set; } = string.Empty;

    public string? Description { get; set; }

    public decimal UnitPrice { get; set; }

    public int Quantity { get; set; }

    public decimal Subtotal { get; set; }
}

public class PaymentDetailDto
{
    public Guid Id { get; set; }

    public string PaymentNo { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public DateTime PaymentDate { get; set; }

    public PaymentMethod PaymentMethod { get; set; }

    public PaymentStatus Status { get; set; }

    public string? BankTransactionNo { get; set; }

    public string? Payer { get; set; }

    public string? Remarks { get; set; }

    public DateTime CreatedAt { get; set; }

    public string CreatedBy { get; set; } = string.Empty;
}

public class ReconciliationDetailDto
{
    public Guid Id { get; set; }

    public DateTime ReconcileDate { get; set; }

    public decimal ExpectedAmount { get; set; }

    public decimal ActualAmount { get; set; }

    public decimal Difference { get; set; }

    public ReconciliationStatus Status { get; set; }

    public string? ResolvedBy { get; set; }

    public DateTime? ResolvedAt { get; set; }

    public string? Remarks { get; set; }
}
