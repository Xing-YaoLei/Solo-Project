using SiteSchedule.Dtos.ActionLog;
using SiteSchedule.Dtos.Common;

namespace SiteSchedule.Services;

public interface IActionLogService
{
    Task<PagedResult<ActionLogDto>> GetPagedListAsync(ActionLogQueryDto query);
    Task<List<ActionLogDto>> GetBySiteIdAsync(int siteId);
    Task<ActionLogDto> CreateAsync(ActionLogCreateDto dto);
}
