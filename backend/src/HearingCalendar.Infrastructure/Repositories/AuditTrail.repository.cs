using HearingCalendar.Domain.Common;
using HearingCalendar.Infrastructure.Data;

namespace HearingCalendar.Infrastructure.Repositories;

public class AuditTrailRepository
{
    private readonly HearingCalendarDbContext _context;

    public AuditTrailRepository(HearingCalendarDbContext context)
    {
        _context = context;
    }

    public async Task LogAsync(string entityName, Guid entityId, string action, Guid performedBy, string? details = null, string? oldValues = null, string? newValues = null)
    {
        var auditTrail = new AuditTrail
        {
            EntityName = entityName,
            EntityId = entityId,
            Action = action,
            PerformedBy = performedBy,
            Details = details,
            OldValues = oldValues,
            NewValues = newValues,
            Timestamp = DateTime.UtcNow
        };

        _context.AuditTrails.Add(auditTrail);
        await _context.SaveChangesAsync();
    }
}
