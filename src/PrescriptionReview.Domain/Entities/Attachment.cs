using PrescriptionReview.Domain.Enums;

namespace PrescriptionReview.Domain.Entities;

public class Attachment
{
    public int Id { get; set; }
    public int PrescriptionId { get; set; }
    public Prescription? Prescription { get; set; }
    public AttachmentType Type { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string ContentType { get; set; } = string.Empty;
    public int UploadedBy { get; set; }
    public User? Uploader { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.Now;
}
