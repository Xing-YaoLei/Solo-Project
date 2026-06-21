using HearingCalendar.Application.Dtos;

namespace HearingCalendar.Application.Interfaces;

public interface IConflictService
{
    Task<ConflictResponse> CreateAsync(CreateConflictRequest request, Guid userId);
    Task<ConflictResponse> ResolveAsync(Guid conflictId, ResolveConflictRequest request, Guid userId);
    Task<ConflictResponse> GetByIdAsync(Guid id, Guid? callerUserId = null);
    Task<IEnumerable<ConflictResponse>> GetByHearingAsync(Guid hearingId, Guid? callerUserId = null);
    Task<IEnumerable<ConflictResponse>> GetActiveConflictsAsync(Guid? callerUserId = null);
}
