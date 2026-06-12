namespace ColdChainScheduler.API.Dtos;

public class LeaderTierDto
{
    public int Id { get; set; }
    public string TierName { get; set; } = string.Empty;
    public string TierCode { get; set; } = string.Empty;
    public decimal MinOrderAmount { get; set; }
    public decimal CommissionRate { get; set; }
    public string? Description { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
