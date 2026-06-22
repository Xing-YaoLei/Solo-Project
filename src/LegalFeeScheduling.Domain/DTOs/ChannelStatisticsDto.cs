using LegalFeeScheduling.Domain.Enums;

namespace LegalFeeScheduling.Domain.DTOs;

public class ChannelStatisticsDto
{
    public Channel Channel { get; set; }

    public int QuoteCount { get; set; }

    public decimal TotalAmount { get; set; }

    public decimal CollectedAmount { get; set; }

    public int CompletedCount { get; set; }
}
