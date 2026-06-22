using ComplianceAudit.Core.Entities;
using ComplianceAudit.Core.Enums;

namespace ComplianceAudit.Core.Interfaces;

public interface IAuditScheduleService
{
    Task<AuditSchedule> CreateScheduleAsync(AuditSchedule schedule, long currentUserId);
    Task<AuditSchedule?> GetScheduleByIdAsync(long id);
    Task<(IEnumerable<AuditSchedule> Items, int TotalCount)> GetSchedulesAsync(
        int pageNumber, int pageSize,
        long? auditorId, long? businessOwnerId,
        CheckStatus? status, RiskLevel? riskLevel,
        DateTime? startDateFrom, DateTime? startDateTo);
    Task<AuditSchedule> UpdateScheduleAsync(AuditSchedule schedule, long currentUserId);
    Task DeleteScheduleAsync(long id, long currentUserId);
    Task StartScheduleAsync(long scheduleId, long currentUserId);
    Task SubmitScheduleAsync(long scheduleId, long currentUserId);
    Task ReviewScheduleAsync(long scheduleId, long currentUserId, bool approved, string comments);
    Task CloseScheduleAsync(long scheduleId, long currentUserId);
    Task<IEnumerable<AuditSchedule>> GetMySchedulesAsync(long userId, AuditRole role);
}
