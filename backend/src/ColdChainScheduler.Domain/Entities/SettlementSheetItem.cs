namespace ColdChainScheduler.Domain.Entities;

public class SettlementSheetItem
{
    public int Id { get; set; }
    public int SettlementSheetId { get; set; }
    public int ProductTagId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Subtotal { get; set; }
    public string? CaliberNote { get; set; }

    public SettlementSheet SettlementSheet { get; set; } = null!;
    public ProductTag ProductTag { get; set; } = null!;
}
