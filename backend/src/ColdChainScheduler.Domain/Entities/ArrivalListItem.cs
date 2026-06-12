namespace ColdChainScheduler.Domain.Entities;

public class ArrivalListItem
{
    public int Id { get; set; }
    public int ArrivalListId { get; set; }
    public int ProductTagId { get; set; }
    public int ExpectedQty { get; set; }
    public int? ActualQty { get; set; }
    public decimal? Temperature { get; set; }
    public string? Condition { get; set; }
    public string? Notes { get; set; }

    public ArrivalList ArrivalList { get; set; } = null!;
    public ProductTag ProductTag { get; set; } = null!;
}
