using ColdChainScheduler.Domain.Enums;
namespace ColdChainScheduler.API.Dtos;

public class GroupBatchDto
{
    public int Id { get; set; }
    public string BatchNo { get; set; } = string.Empty;
    public string BatchName { get; set; } = string.Empty;
    public string LeaderName { get; set; } = string.Empty;
    public string? LeaderPhone { get; set; }
    public int LeaderTierId { get; set; }
    public string LeaderTierName { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public DateTime? DeliveryTime { get; set; }
    public BatchStatus Status { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
