using HearingCalendar.Application.Dtos;

namespace HearingCalendar.Application.Interfaces;

public interface IParticipantService
{
    Task<ParticipantResponse> AddAsync(AddParticipantRequest request, Guid userId);
    Task<ParticipantResponse> UpdateAttendanceAsync(Guid participantId, UpdateAttendanceRequest request, Guid userId);
    Task BatchUpdateAttendanceAsync(BatchAttendanceRequest request, Guid userId);
    Task RemoveAsync(Guid participantId, Guid userId);
    Task<IEnumerable<ParticipantResponse>> GetByHearingAsync(Guid hearingId);
}
