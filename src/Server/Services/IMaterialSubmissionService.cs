using SiteSchedule.Dtos.Common;
using SiteSchedule.Dtos.MaterialSubmission;

namespace SiteSchedule.Services;

public interface IMaterialSubmissionService
{
    Task<PagedResult<MaterialSubmissionDto>> GetPagedListAsync(MaterialSubmissionQueryDto query);
    Task<MaterialSubmissionDto?> GetByIdAsync(int id);
    Task<List<MaterialSubmissionDto>> GetBySiteIdAsync(int siteId);
    Task<MaterialSubmissionDto> CreateAsync(MaterialSubmissionCreateDto dto);
    Task<MaterialSubmissionDto> UpdateAsync(MaterialSubmissionUpdateDto dto);
    Task<bool> DeleteAsync(int id);
    Task<MaterialSubmissionDto> ReviewAsync(MaterialSubmissionReviewDto dto);
    Task<MaterialSubmissionDto> RetryAsync(MaterialSubmissionRetryDto dto);
    Task<MaterialSubmissionDto> CloseAsync(MaterialSubmissionCloseDto dto);
    Task<MaterialSubmissionDto> SupplementAsync(MaterialSubmissionCreateDto dto);
}
