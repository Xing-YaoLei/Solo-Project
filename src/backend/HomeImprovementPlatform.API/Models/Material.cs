namespace HomeImprovementPlatform.API.Models;

public class Material
{
    public Guid Id { get; set; }
    public string MaterialCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Specification { get; set; }
    public string Brand { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public decimal StandardPrice { get; set; }
    public string? Category { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<DocumentItem> DocumentItems { get; set; } = new List<DocumentItem>();
}
