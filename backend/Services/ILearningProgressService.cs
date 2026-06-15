using CertSchedulePlatform.DTOs;
using CertSchedulePlatform.Entities;

namespace CertSchedulePlatform.Services;

public interface ILearningProgressService
{
    Task<PagedResult<LearningProgressDto>> GetListAsync(int? userId, int? certificateId, int? courseId,
        ProgressStatus? status, int pageIndex, int pageSize);
    Task<LearningProgressDto?> GetByIdAsync(int id);
    Task<LearningProgressDetailDto> GetDetailAsync(int id);
    Task<LearningProgressDto> CreateAsync(LearningProgressCreateDto dto);
    Task<LearningProgressDto?> UpdateProgressAsync(int id, LearningProgressUpdateDto dto);
    Task<List<ProgressHistoryDto>> GetHistoryAsync(int progressId);
    Task<List<LearningProgressDto>> GetByUserAsync(int userId, int? certificateId = null);
}
