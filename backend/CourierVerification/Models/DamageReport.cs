using CourierVerification.Enums;

namespace CourierVerification.Models;

public class DamageReport
{
    public Guid Id { get; set; }
    public Guid VerificationRecordId { get; set; }
    public DamageRange DamageRange { get; set; }
    public DamageSeverity Severity { get; set; }
    public string DamageDescription { get; set; } = string.Empty;
    public List<string> AffectedItems { get; set; } = new();
    public ResponsibleParty InitialResponsibility { get; set; }
    public ResponsibleParty? FinalResponsibility { get; set; }
    public string? ResponsibilityAdjustedBy { get; set; }
    public DateTimeOffset? ResponsibilityAdjustedAt { get; set; }
    public string? SupplementaryNotes { get; set; }
    public string? SupplementaryBy { get; set; }
    public DateTimeOffset? SupplementaryAt { get; set; }
    public string? ReportedBy { get; set; }
    public DateTimeOffset ReportedAt { get; set; }

    public virtual VerificationRecord? VerificationRecord { get; set; }
}
