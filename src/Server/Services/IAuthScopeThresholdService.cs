using SiteSchedule.Dtos.AuthScopeThreshold;
using SiteSchedule.Dtos.Common;

namespace SiteSchedule.Services;

public interface IAuthScopeThresholdService
{
    Task<PagedResult<AuthScopeThresholdDto>> GetPagedListAsync(AuthScopeThresholdQueryDto query);
    Task<AuthScopeThresholdDto?> GetByIdAsync(int id);
    Task<AuthScopeThresholdDto> CreateAsync(AuthScopeThresholdCreateDto dto);
    Task<AuthScopeThresholdDto> UpdateAsync(AuthScopeThresholdUpdateDto dto);
    Task<bool> DeleteAsync(int id);
    Task<List<AuthScopeThresholdDto>> GetAllAsync();
}
