using LegalFeeScheduling.Domain.Enums;

namespace LegalFeeScheduling.Domain.DTOs;

public class ChannelStatisticsDto
{
    public Channel Channel { get; set; }

    public int QuoteCount { get; set; }

    public decimal TotalAmount { get; set; }

    public decimal PaidAmount { get; set; }

    public decimal OutstandingAmount { get; set; }

    public decimal CollectionRate { get; set; }
}
