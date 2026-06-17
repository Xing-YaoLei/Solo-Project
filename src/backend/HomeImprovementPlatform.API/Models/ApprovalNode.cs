using HomeImprovementPlatform.API.Enums;

namespace HomeImprovementPlatform.API.Models;

public class ApprovalNode
{
    public Guid Id { get; set; }
    public int NodeOrder { get; set; }
    public string NodeName { get; set; } = string.Empty;
    public DocumentStatus TargetStatus { get; set; }
    public bool IsApproved { get; set; }
    public string? Comments { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Guid DocumentId { get; set; }
    public virtual Document? Document { get; set; }
    public Guid ApproverId { get; set; }
    public virtual ApplicationUser? Approver { get; set; }
}
