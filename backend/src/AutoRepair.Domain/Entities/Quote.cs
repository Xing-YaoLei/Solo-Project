namespace AutoRepair.Domain.Entities;

public enum QuoteStatus
{
    Draft = 0,
    PendingApproval = 1,
    Approved = 2,
    Rejected = 3,
    Expired = 4
}

public class Quote
{
    public Guid Id { get; set; }
    public string QuoteNumber { get; set; } = string.Empty;
    public Guid WorkOrderId { get; set; }
    public string CreatedByUserId { get; set; } = string.Empty;
    public QuoteStatus Status { get; set; }
    public decimal PartsTotal { get; set; }
    public decimal LaborTotal { get; set; }
    public decimal Discount { get; set; }
    public decimal Tax { get; set; }
    public decimal GrandTotal { get; set; }
    public string? CustomerNotes { get; set; }
    public string? InternalNotes { get; set; }
    public DateTime? ValidUntil { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public WorkOrder? WorkOrder { get; set; }
    public AppUser? CreatedByUser { get; set; }
    public ICollection<QuoteItem> Items { get; set; } = new List<QuoteItem>();
    public ICollection<ReviewOpinion> ReviewOpinions { get; set; } = new List<ReviewOpinion>();
}
