using SiteSchedule.Dtos.Common;
using SiteSchedule.Dtos.ConstructionSite;

namespace SiteSchedule.Services;

public interface IConstructionSiteService
{
    Task<PagedResult<ConstructionSiteDto>> GetPagedListAsync(ConstructionSiteQueryDto query);
    Task<ConstructionSiteDto?> GetByIdAsync(int id);
    Task<ConstructionSiteDto> CreateAsync(ConstructionSiteCreateDto dto);
    Task<ConstructionSiteDto> UpdateAsync(ConstructionSiteUpdateDto dto);
    Task<bool> DeleteAsync(int id);
    Task<bool> UpdateStatusAsync(ConstructionSiteStatusUpdateDto dto, string? operatorName = null);
    Task<double> GetMaterialCompleteRateAsync(int siteId);
}
