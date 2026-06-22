using ComplianceAudit.Core.Entities;

namespace ComplianceAudit.Core.Interfaces;

public interface IEvidenceService
{
    Task<Evidence> AddEvidenceAsync(Evidence evidence, long currentUserId);
    Task<IEnumerable<Evidence>> AddEvidencesAsync(IEnumerable<Evidence> evidences, long currentUserId);
    Task<Evidence?> GetEvidenceByIdAsync(long id);
    Task<IEnumerable<Evidence>> GetEvidencesByCheckRecordIdAsync(long checkRecordId);
    Task<IEnumerable<Evidence>> GetEvidencesByChecklistItemIdAsync(long checklistItemId);
    Task<IEnumerable<Evidence>> GetEvidencesBySamplingIdAsync(long samplingId);
    Task<IEnumerable<Evidence>> GetEvidencesByRectificationIdAsync(long rectificationId);
    Task DeleteEvidenceAsync(long id, long currentUserId);
    Task<string> GeneratePresignedUploadUrl(string fileName, string contentType);
}
