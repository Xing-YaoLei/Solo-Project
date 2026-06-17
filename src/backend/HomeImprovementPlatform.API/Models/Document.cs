using HomeImprovementPlatform.API.Enums;

namespace HomeImprovementPlatform.API.Models;

public class Document
{
    public Guid Id { get; set; }
    public string DocumentNumber { get; set; } = string.Empty;
    public DocumentType Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal ExpectedAmount { get; set; }
    public decimal? ActualAmount { get; set; }
    public AmountConsistencyStatus AmountConsistency { get; set; } = AmountConsistencyStatus.PendingVerification;
    public DocumentStatus Status { get; set; } = DocumentStatus.Draft;
    public DateTime MeasurementDate { get; set; }
    public DateTime? ApprovalDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Guid ProjectId { get; set; }
    public virtual Project? Project { get; set; }
    public Guid CreatedById { get; set; }
    public virtual ApplicationUser? CreatedBy { get; set; }

    public virtual ICollection<DocumentItem> Items { get; set; } = new List<DocumentItem>();
    public virtual ICollection<ApprovalNode> ApprovalNodes { get; set; } = new List<ApprovalNode>();
    public virtual ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
    public virtual ICollection<DocumentHistory> DocumentHistories { get; set; } = new List<DocumentHistory>();
}
