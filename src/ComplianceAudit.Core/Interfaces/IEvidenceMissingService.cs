using ComplianceAudit.Core.Entities;
using ComplianceAudit.Core.Enums;

namespace ComplianceAudit.Core.Interfaces;

public interface IEvidenceMissingService
{
    Task<EvidenceMissingRecord> CreateEvidenceMissingRecordAsync(EvidenceMissingRecord record, long currentUserId);
    Task<EvidenceMissingRecord?> GetEvidenceMissingByIdAsync(long id);
    Task<IEnumerable<EvidenceMissingRecord>> GetByCheckRecordIdAsync(long checkRecordId);
    Task<IEnumerable<EvidenceMissingRecord>> GetByScheduleIdAsync(long scheduleId);
    Task<(IEnumerable<EvidenceMissingRecord> Items, int TotalCount)> GetEvidenceMissingRecordsAsync(
        int pageNumber, int pageSize,
        EvidenceStatus? status, long? responsibleId, bool myAssigned, long? currentUserId);
    Task RequestSupplementAsync(long id, string description, long responsibleId, DateTime deadline, long currentUserId);
    Task ProvideEvidenceAsync(long id, string supplierComments, IEnumerable<Evidence> evidences, long currentUserId);
    Task ReviewSuppliedEvidenceAsync(long id, EvidenceStatus newStatus, string reviewerComments, long currentUserId);
    Task WaiveEvidenceRequirementAsync(long id, string waiveReason, long currentUserId);
}
