namespace AutoRepair.Domain.Entities;

public class QuoteItem
{
    public Guid Id { get; set; }
    public Guid QuoteId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal LaborCost { get; set; }
    public bool IsPart { get; set; }
    public Guid? PartId { get; set; }

    public Quote? Quote { get; set; }
    public Part? Part { get; set; }
}
