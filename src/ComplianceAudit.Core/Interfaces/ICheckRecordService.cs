using ComplianceAudit.Core.Entities;
using ComplianceAudit.Core.Enums;

namespace ComplianceAudit.Core.Interfaces;

public interface ICheckRecordService
{
    Task<CheckRecord> CreateCheckRecordAsync(CheckRecord record, long currentUserId);
    Task<CheckRecord?> GetCheckRecordByIdAsync(long id);
    Task<IEnumerable<CheckRecord>> GetCheckRecordsByScheduleIdAsync(long scheduleId);
    Task<IEnumerable<CheckRecord>> GetCheckRecordsByChecklistItemIdAsync(long checklistItemId);
    Task<IEnumerable<CheckRecord>> GetCheckRecordsBySamplingIdAsync(long samplingId);
    Task<CheckRecord> UpdateCheckRecordAsync(CheckRecord record, long currentUserId);
    Task UpdateCheckRecordStatusAsync(long id, CheckStatus status, long currentUserId, string? comments = null);
    Task BulkUpdateCheckRecordStatusAsync(IEnumerable<long> ids, CheckStatus status, long currentUserId, string? batchId = null);
    Task SubmitCheckRecordAsync(long id, long currentUserId);
    Task ReviewCheckRecordAsync(long id, long currentUserId, bool approved, string reviewComments);
    Task SetCheckRecordResultAsync(long id, bool isCompliant, string findings, RiskLevel riskLevel, long currentUserId);
    Task<IEnumerable<CheckRecord>> GetCheckRecordsByDocumentNoAsync(string documentNo);
}
