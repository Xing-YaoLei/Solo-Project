using CourierVerification.Enums;

namespace CourierVerification.Models;

public class VerificationPhoto
{
    public Guid Id { get; set; }
    public Guid VerificationRecordId { get; set; }
    public string PhotoUrl { get; set; } = string.Empty;
    public PhotoType PhotoType { get; set; }
    public bool IsDamagePhoto { get; set; }
    public string? UploadedBy { get; set; }
    public DateTimeOffset UploadedAt { get; set; }
    public string? Remark { get; set; }

    public virtual VerificationRecord? VerificationRecord { get; set; }
}
