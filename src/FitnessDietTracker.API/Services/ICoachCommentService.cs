using FitnessDietTracker.API.Dtos;

namespace FitnessDietTracker.API.Services;

public interface ICoachCommentService
{
    Task<CoachCommentDto?> GetByDietRecordIdAsync(int dietRecordId);
    Task<List<CoachCommentHistoryDto>> GetHistoryAsync(int commentId);
    Task<CoachCommentDto> CreateAsync(CoachCommentCreateDto dto);
    Task<CoachCommentDto?> UpdateAsync(int id, CoachCommentUpdateDto dto, int operatorId);
    Task<bool> DeleteAsync(int id);
}
