using ColdChainScheduler.Domain.Enums;
namespace ColdChainScheduler.API.Dtos;

public class SettlementSheetDto
{
    public int Id { get; set; }
    public string SheetNo { get; set; } = string.Empty;
    public int GroupBatchId { get; set; }
    public string BatchNo { get; set; } = string.Empty;
    public int LeaderTierId { get; set; }
    public string LeaderTierName { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public int ItemCount { get; set; }
    public SettlementStatus Status { get; set; }
    public string? CaliberDescription { get; set; }
    public List<SettlementSheetItemDto> Items { get; set; } = new();
    public DateTime? SettledAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
