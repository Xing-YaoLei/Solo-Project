using HearingCalendar.Application.Dtos;
using HearingCalendar.Application.Interfaces;
using HearingCalendar.Domain.Entities;
using HearingCalendar.Domain.Enums;
using HearingCalendar.Infrastructure.Repositories;

namespace HearingCalendar.Application.Services;

public class ConflictService : IConflictService
{
    private readonly IRepository<ConflictOfInterest> _conflictRepo;
    private readonly IRepository<HearingSchedule> _hearingRepo;
    private readonly AuditTrailRepository _auditTrailRepo;

    public ConflictService(
        IRepository<ConflictOfInterest> conflictRepo,
        IRepository<HearingSchedule> hearingRepo,
        AuditTrailRepository auditTrailRepo)
    {
        _conflictRepo = conflictRepo;
        _hearingRepo = hearingRepo;
        _auditTrailRepo = auditTrailRepo;
    }

    public async Task<ConflictResponse> CreateAsync(CreateConflictRequest request, Guid userId)
    {
        var conflict = new ConflictOfInterest
        {
            HearingId = request.HearingId,
            ConflictType = request.ConflictType,
            Description = request.Description,
            DetectedBy = userId,
            DetectedAt = DateTime.UtcNow,
            ResolutionStatus = ConflictResolutionStatus.Detected,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var created = await _conflictRepo.AddAsync(conflict);

        var hearing = await _hearingRepo.GetByIdAsync(request.HearingId);
        if (hearing is not null)
        {
            hearing.IsConflictFlagged = true;
            hearing.ConflictId = created.Id;
            await _hearingRepo.UpdateAsync(hearing);
        }

        await _auditTrailRepo.LogAsync(nameof(ConflictOfInterest), created.Id, "Create", userId);

        return MapToResponse(created);
    }

    public async Task<ConflictResponse> ResolveAsync(Guid conflictId, ResolveConflictRequest request, Guid userId)
    {
        var conflict = await _conflictRepo.GetByIdAsync(conflictId);
        if (conflict is null)
            throw new KeyNotFoundException($"Conflict {conflictId} not found");

        conflict.Resolution = request.Resolution;
        conflict.ResolutionStatus = request.ResolutionStatus;
        conflict.ResolvedBy = userId;
        conflict.ResolvedAt = DateTime.UtcNow;
        conflict.RelatedAttachmentId = request.RelatedAttachmentId;

        await _conflictRepo.UpdateAsync(conflict);

        if (conflict.ResolutionStatus == ConflictResolutionStatus.Resolved ||
            conflict.ResolutionStatus == ConflictResolutionStatus.Waived)
        {
            var activeConflicts = await _conflictRepo.FindAsync(c =>
                c.HearingId == conflict.HearingId &&
                c.Id != conflict.Id &&
                c.ResolutionStatus != ConflictResolutionStatus.Resolved &&
                c.ResolutionStatus != ConflictResolutionStatus.Waived);

            if (!activeConflicts.Any())
            {
                var hearing = await _hearingRepo.GetByIdAsync(conflict.HearingId);
                if (hearing is not null)
                {
                    hearing.IsConflictFlagged = false;
                    hearing.ConflictId = null;
                    await _hearingRepo.UpdateAsync(hearing);
                }
            }
        }

        await _auditTrailRepo.LogAsync(nameof(ConflictOfInterest), conflictId, "Resolve", userId);

        return MapToResponse(conflict);
    }

    public async Task<ConflictResponse> GetByIdAsync(Guid id)
    {
        var conflict = await _conflictRepo.GetByIdAsync(id);
        if (conflict is null)
            throw new KeyNotFoundException($"Conflict {id} not found");

        return MapToResponse(conflict);
    }

    public async Task<IEnumerable<ConflictResponse>> GetByHearingAsync(Guid hearingId)
    {
        var conflicts = await _conflictRepo.FindAsync(c => c.HearingId == hearingId);
        return conflicts.Select(MapToResponse);
    }

    public async Task<IEnumerable<ConflictResponse>> GetActiveConflictsAsync()
    {
        var conflicts = await _conflictRepo.FindAsync(c =>
            c.ResolutionStatus == ConflictResolutionStatus.Detected ||
            c.ResolutionStatus == ConflictResolutionStatus.UnderReview ||
            c.ResolutionStatus == ConflictResolutionStatus.Escalated);
        return conflicts.Select(MapToResponse);
    }

    private static ConflictResponse MapToResponse(ConflictOfInterest c)
    {
        return new ConflictResponse(
            c.Id, c.HearingId, c.ConflictType, c.Description,
            c.DetectedBy, c.DetectedAt, c.ResolutionStatus,
            c.Resolution, c.ResolvedBy, c.ResolvedAt, c.RelatedAttachmentId);
    }
}
