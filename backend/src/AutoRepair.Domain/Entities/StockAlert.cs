namespace AutoRepair.Domain.Entities;

public class StockAlert
{
    public Guid Id { get; set; }
    public Guid PartInventoryId { get; set; }
    public RiskLevel RiskLevel { get; set; }
    public string AlertMessage { get; set; } = string.Empty;
    public bool IsAcknowledged { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? AcknowledgedAt { get; set; }
    public string? AcknowledgedByUserId { get; set; }

    public PartInventory? PartInventory { get; set; }
    public AppUser? AcknowledgedByUser { get; set; }
    public ICollection<CommunicationLog> CommunicationLogs { get; set; } = new List<CommunicationLog>();
    public ICollection<ReviewOpinion> ReviewOpinions { get; set; } = new List<ReviewOpinion>();
}
