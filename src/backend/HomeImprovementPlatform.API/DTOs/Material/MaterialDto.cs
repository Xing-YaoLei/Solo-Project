namespace HomeImprovementPlatform.API.DTOs.Material;

public class MaterialDto
{
    public Guid Id { get; set; }
    public string MaterialCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Specification { get; set; }
    public string Brand { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public decimal StandardPrice { get; set; }
    public string? Category { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateMaterialDto
{
    public string MaterialCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Specification { get; set; }
    public string Brand { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public decimal StandardPrice { get; set; }
    public string? Category { get; set; }
}

public class UpdateMaterialDto
{
    public string MaterialCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Specification { get; set; }
    public string Brand { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public decimal StandardPrice { get; set; }
    public string? Category { get; set; }
    public bool IsActive { get; set; }
}
