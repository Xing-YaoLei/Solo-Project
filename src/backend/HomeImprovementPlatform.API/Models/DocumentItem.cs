namespace HomeImprovementPlatform.API.Models;

public class DocumentItem
{
    public Guid Id { get; set; }
    public int ItemOrder { get; set; }
    public string ItemCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Specification { get; set; }
    public string Unit { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Subtotal { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Guid DocumentId { get; set; }
    public virtual Document? Document { get; set; }
    public Guid? MaterialId { get; set; }
    public virtual Material? Material { get; set; }
}
