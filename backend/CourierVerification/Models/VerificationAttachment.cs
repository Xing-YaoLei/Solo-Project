namespace CourierVerification.Models;

public class VerificationAttachment
{
    public Guid Id { get; set; }
    public Guid VerificationRecordId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string? ContentType { get; set; }
    public string? UploadedBy { get; set; }
    public DateTimeOffset UploadedAt { get; set; }

    public virtual VerificationRecord? VerificationRecord { get; set; }
}
