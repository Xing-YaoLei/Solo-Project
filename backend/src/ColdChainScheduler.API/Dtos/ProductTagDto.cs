namespace ColdChainScheduler.API.Dtos;

public class ProductTagDto
{
    public int Id { get; set; }
    public string TagCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string? Category { get; set; }
    public decimal? StorageTempMin { get; set; }
    public decimal? StorageTempMax { get; set; }
    public int? ShelfLifeHours { get; set; }
    public string? Unit { get; set; }
    public decimal UnitPrice { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
