using SiteSchedule.Dtos.Common;
using SiteSchedule.Dtos.TimelineChange;

namespace SiteSchedule.Services;

public interface ITimelineChangeService
{
    Task<PagedResult<TimelineChangeDto>> GetPagedListAsync(TimelineChangeQueryDto query);
    Task<List<TimelineChangeDto>> GetBySiteIdAsync(int siteId);
    Task<TimelineChangeDto> CreateAsync(TimelineChangeCreateDto dto);
}
