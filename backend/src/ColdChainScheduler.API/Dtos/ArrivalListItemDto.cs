using ColdChainScheduler.Domain.Enums;
namespace ColdChainScheduler.API.Dtos;

public class ArrivalListItemDto
{
    public int Id { get; set; }
    public int ArrivalListId { get; set; }
    public int ProductTagId { get; set; }
    public string ProductTagName { get; set; } = string.Empty;
    public int ExpectedQuantity { get; set; }
    public int? ActualQuantity { get; set; }
    public decimal? Temperature { get; set; }
    public string? Condition { get; set; }
    public string? Remark { get; set; }
    public PickupStatus? PickupStatus { get; set; }
    public DateTime? PickupTime { get; set; }
}
