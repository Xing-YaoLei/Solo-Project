using ColdChainScheduler.Domain.Enums;

namespace ColdChainScheduler.Domain.Entities;

public class GroupBatch
{
    public int Id { get; set; }
    public string BatchNo { get; set; } = string.Empty;
    public string BatchName { get; set; } = string.Empty;
    public string LeaderName { get; set; } = string.Empty;
    public string? LeaderPhone { get; set; }
    public int LeaderTierId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public DateTime? DeliveryTime { get; set; }
    public BatchStatus BatchStatus { get; set; } = BatchStatus.Draft;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public LeaderTier LeaderTier { get; set; } = null!;
    public ICollection<SettlementSheet> SettlementSheets { get; set; } = new List<SettlementSheet>();
    public ICollection<ArrivalList> ArrivalLists { get; set; } = new List<ArrivalList>();
    public ICollection<ExceptionOrder> ExceptionOrders { get; set; } = new List<ExceptionOrder>();
}
