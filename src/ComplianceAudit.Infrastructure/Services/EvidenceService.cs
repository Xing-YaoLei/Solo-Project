using ComplianceAudit.Core.Entities;
using ComplianceAudit.Core.Interfaces;

namespace ComplianceAudit.Infrastructure.Services;

public class EvidenceService : IEvidenceService
{
    private readonly IUnitOfWork _unitOfWork;

    public EvidenceService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Evidence> AddEvidenceAsync(Evidence evidence, long currentUserId)
    {
        evidence.CreatedAt = DateTime.UtcNow;
        evidence.CreatedBy = currentUserId;

        var created = await _unitOfWork.Evidences.AddAsync(evidence);
        await _unitOfWork.SaveChangesAsync();

        return created;
    }

    public async Task<IEnumerable<Evidence>> AddEvidencesAsync(IEnumerable<Evidence> evidences, long currentUserId)
    {
        var evidenceList = evidences.ToList();
        foreach (var evidence in evidenceList)
        {
            evidence.CreatedAt = DateTime.UtcNow;
            evidence.CreatedBy = currentUserId;
        }

        var created = await _unitOfWork.Evidences.AddRangeAsync(evidenceList);
        await _unitOfWork.SaveChangesAsync();
        return created;
    }

    public async Task<Evidence?> GetEvidenceByIdAsync(long id)
    {
        return await _unitOfWork.Evidences.GetByIdAsync(id);
    }

    public async Task<IEnumerable<Evidence>> GetEvidencesByCheckRecordIdAsync(long checkRecordId)
    {
        return await _unitOfWork.Evidences
            .FindAsync(e => e.CheckRecordId == checkRecordId && !e.IsDeleted);
    }

    public async Task<IEnumerable<Evidence>> GetEvidencesByChecklistItemIdAsync(long checklistItemId)
    {
        return await _unitOfWork.Evidences
            .FindAsync(e => e.ChecklistItemId == checklistItemId && !e.IsDeleted);
    }

    public async Task<IEnumerable<Evidence>> GetEvidencesBySamplingIdAsync(long samplingId)
    {
        return await _unitOfWork.Evidences
            .FindAsync(e => e.SamplingRecordId == samplingId && !e.IsDeleted);
    }

    public async Task<IEnumerable<Evidence>> GetEvidencesByRectificationIdAsync(long rectificationId)
    {
        return await _unitOfWork.Evidences
            .FindAsync(e => e.RectificationId == rectificationId && !e.IsDeleted);
    }

    public async Task DeleteEvidenceAsync(long id, long currentUserId)
    {
        var evidence = await _unitOfWork.Evidences.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Evidence {id} not found");

        evidence.IsDeleted = true;
        evidence.UpdatedAt = DateTime.UtcNow;
        evidence.UpdatedBy = currentUserId;

        _unitOfWork.Evidences.Update(evidence);
        await _unitOfWork.SaveChangesAsync();
    }

    public Task<string> GeneratePresignedUploadUrl(string fileName, string contentType)
    {
        var fileKey = $"evidences/{DateTime.UtcNow:yyyy/MM/dd}/{Guid.NewGuid()}_{fileName}";
        return Task.FromResult($"/api/uploads/{fileKey}");
    }
}
