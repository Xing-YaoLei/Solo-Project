namespace ColdChainScheduler.API.Dtos;

public class SettlementSheetItemDto
{
    public int Id { get; set; }
    public int SettlementSheetId { get; set; }
    public int ProductTagId { get; set; }
    public string ProductTagName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Subtotal { get; set; }
    public string? CaliberNote { get; set; }
}
