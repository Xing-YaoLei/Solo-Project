namespace HomeImprovementPlatform.API.Models;

public class Attachment
{
    public Guid Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Guid DocumentId { get; set; }
    public virtual Document? Document { get; set; }
    public Guid UploadedById { get; set; }
    public virtual ApplicationUser? UploadedBy { get; set; }
}
