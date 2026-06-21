namespace CourierVerification.Models;

public class TimePoint
{
    public Guid Id { get; set; }
    public Guid VerificationRecordId { get; set; }
    public string PointType { get; set; } = string.Empty;
    public DateTimeOffset PointTime { get; set; }
    public string? OperatorId { get; set; }
    public string? OperatorName { get; set; }
    public string? Description { get; set; }

    public virtual VerificationRecord? VerificationRecord { get; set; }
}
