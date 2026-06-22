using ComplianceAudit.Core.Entities;
using ComplianceAudit.Core.Enums;

namespace ComplianceAudit.Core.Interfaces;

public interface ISamplingService
{
    Task<IEnumerable<SamplingRecord>> CreateSamplingRecordsAsync(long scheduleId, IEnumerable<SamplingRecord> records, long currentUserId);
    Task<SamplingRecord?> GetSamplingByIdAsync(long id);
    Task<(IEnumerable<SamplingRecord> Items, int TotalCount)> GetSamplingByScheduleIdAsync(
        long scheduleId, int pageNumber, int pageSize,
        CheckStatus? status, string? documentType, string? keyword);
    Task<SamplingRecord> UpdateSamplingAsync(SamplingRecord record, long currentUserId);
    Task DeleteSamplingAsync(long id, long currentUserId);
    Task BulkUpdateSamplingStatusAsync(IEnumerable<long> ids, CheckStatus status, long currentUserId, string? batchId = null);
    Task<IEnumerable<SamplingRecord>> GetAllSamplingByScheduleIdAsync(long scheduleId);
}
