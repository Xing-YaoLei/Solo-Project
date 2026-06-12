using ColdChainScheduler.Domain.Enums;

namespace ColdChainScheduler.Domain.Entities;

public class ArrivalList
{
    public int Id { get; set; }
    public string ListNo { get; set; } = string.Empty;
    public int GroupBatchId { get; set; }
    public DateTime ArrivalTime { get; set; }
    public string? Receiver { get; set; }
    public ArrivalStatus ArrivalStatus { get; set; } = ArrivalStatus.Pending;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public GroupBatch GroupBatch { get; set; } = null!;
    public ICollection<ArrivalListItem> Items { get; set; } = new List<ArrivalListItem>();
}
