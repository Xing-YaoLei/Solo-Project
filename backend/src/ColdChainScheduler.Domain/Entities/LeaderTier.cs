namespace ColdChainScheduler.Domain.Entities;

public class LeaderTier
{
    public int Id { get; set; }
    public string TierName { get; set; } = string.Empty;
    public string TierCode { get; set; } = string.Empty;
    public decimal MinOrderAmount { get; set; }
    public decimal CommissionRate { get; set; }
    public string? Description { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<GroupBatch> GroupBatches { get; set; } = new List<GroupBatch>();
    public ICollection<SettlementSheet> SettlementSheets { get; set; } = new List<SettlementSheet>();
}
