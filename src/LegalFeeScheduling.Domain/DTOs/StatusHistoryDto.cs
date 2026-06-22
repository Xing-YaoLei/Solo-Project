using LegalFeeScheduling.Domain.Enums;

namespace LegalFeeScheduling.Domain.DTOs;

public class StatusHistoryDto
{
    public Guid Id { get; set; }

    public Guid QuoteId { get; set; }

    public QuoteStatus FromStatus { get; set; }

    public QuoteStatus ToStatus { get; set; }

    public string ChangedBy { get; set; } = string.Empty;

    public DateTime ChangedAt { get; set; }

    public string? Remarks { get; set; }
}
