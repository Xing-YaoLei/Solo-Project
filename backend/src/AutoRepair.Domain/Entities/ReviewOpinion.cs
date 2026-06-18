namespace AutoRepair.Domain.Entities;

public class ReviewOpinion
{
    public Guid Id { get; set; }
    public Guid QuoteId { get; set; }
    public Guid? WorkOrderId { get; set; }
    public string ReviewerUserId { get; set; } = string.Empty;
    public string Opinion { get; set; } = string.Empty;
    public bool IsApproved { get; set; }
    public DateTime ReviewedAt { get; set; }

    public Quote? Quote { get; set; }
    public WorkOrder? WorkOrder { get; set; }
    public AppUser? ReviewerUser { get; set; }
}
