namespace ComplianceAudit.Core.Entities;

public class Evidence : BaseEntity
{
    public long? CheckRecordId { get; set; }
    public long? ChecklistItemId { get; set; }
    public long? SamplingRecordId { get; set; }
    public long? RectificationId { get; set; }
    public long? EvidenceMissingRecordId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string ContentType { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsSupplement { get; set; }

    public virtual CheckRecord? CheckRecord { get; set; }
    public virtual ChecklistItem? ChecklistItem { get; set; }
    public virtual SamplingRecord? SamplingRecord { get; set; }
    public virtual Rectification? Rectification { get; set; }
    public virtual EvidenceMissingRecord? EvidenceMissingRecord { get; set; }
}
