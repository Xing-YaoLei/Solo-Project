using ComplianceAudit.Core.Enums;

namespace ComplianceAudit.Core.Entities;

public class ProcessingHistory : BaseEntity
{
    public string EntityType { get; set; } = string.Empty;
    public long EntityId { get; set; }
    public string ActionType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public CheckStatus? FromStatus { get; set; }
    public CheckStatus? ToStatus { get; set; }
    public long OperatorId { get; set; }
    public AuditRole OperatorRole { get; set; }
    public DateTime OperatedAt { get; set; }
    public string? SourceReference { get; set; }
    public string? BatchId { get; set; }
    public string? AdditionalData { get; set; }

    public virtual ApplicationUser Operator { get; set; } = null!;
}
