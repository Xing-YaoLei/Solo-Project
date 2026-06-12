using ColdChainScheduler.Domain.Enums;

namespace ColdChainScheduler.Domain.Entities;

public class SettlementSheet
{
    public int Id { get; set; }
    public string SheetNo { get; set; } = string.Empty;
    public int GroupBatchId { get; set; }
    public int LeaderTierId { get; set; }
    public decimal TotalAmount { get; set; }
    public int ItemCount { get; set; }
    public SettlementStatus SettlementStatus { get; set; } = SettlementStatus.Pending;
    public string? CaliberNote { get; set; }
    public DateTime? SettledAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public GroupBatch GroupBatch { get; set; } = null!;
    public LeaderTier LeaderTier { get; set; } = null!;
    public ICollection<SettlementSheetItem> Items { get; set; } = new List<SettlementSheetItem>();
}
