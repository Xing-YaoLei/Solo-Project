using HearingCalendar.Domain.Common;

namespace HearingCalendar.Domain.Common;

public class AuditTrail : BaseEntity
{
    public required string EntityName { get; set; }
    public Guid EntityId { get; set; }
    public required string Action { get; set; }
    public Guid PerformedBy { get; set; }
    public string? Details { get; set; }
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
    public DateTime Timestamp { get; set; }
}
