namespace AutoRepair.Domain.Entities;

public class PartInventory
{
    public Guid Id { get; set; }
    public Guid PartId { get; set; }
    public int QuantityInStock { get; set; }
    public int ReservedQuantity { get; set; }
    public int ReorderLevel { get; set; }
    public string? Location { get; set; }
    public DateTime LastUpdatedAt { get; set; }

    public Part? Part { get; set; }
    public ICollection<StockAlert> StockAlerts { get; set; } = new List<StockAlert>();
}
