using ColdChainScheduler.Domain.Enums;
namespace ColdChainScheduler.API.Dtos;

public class ArrivalListDto
{
    public int Id { get; set; }
    public string ListNo { get; set; } = string.Empty;
    public int GroupBatchId { get; set; }
    public string BatchNo { get; set; } = string.Empty;
    public DateTime ArrivalTime { get; set; }
    public string? Receiver { get; set; }
    public ArrivalStatus Status { get; set; }
    public string? Notes { get; set; }
    public List<ArrivalListItemDto> Items { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
