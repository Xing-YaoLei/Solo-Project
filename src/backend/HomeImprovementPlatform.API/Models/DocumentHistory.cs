using HomeImprovementPlatform.API.Enums;

namespace HomeImprovementPlatform.API.Models;

public class DocumentHistory
{
    public Guid Id { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
    public string? MaterialsBefore { get; set; }
    public string? MaterialsAfter { get; set; }
    public string? Conclusion { get; set; }
    public string? Source { get; set; }
    public DocumentStatus? OldStatus { get; set; }
    public DocumentStatus? NewStatus { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Guid DocumentId { get; set; }
    public virtual Document? Document { get; set; }
    public Guid CreatedById { get; set; }
    public virtual ApplicationUser? CreatedBy { get; set; }
}
