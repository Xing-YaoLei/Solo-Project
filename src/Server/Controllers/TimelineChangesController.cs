using Microsoft.AspNetCore.Mvc;
using SiteSchedule.Dtos.Common;
using SiteSchedule.Dtos.TimelineChange;
using SiteSchedule.Services;

namespace SiteSchedule.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TimelineChangesController : ControllerBase
{
    private readonly ITimelineChangeService _service;

    public TimelineChangesController(ITimelineChangeService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ApiResponse<PagedResult<TimelineChangeDto>>> GetPagedList([FromQuery] TimelineChangeQueryDto query)
    {
        var result = await _service.GetPagedListAsync(query);
        return ApiResponse<PagedResult<TimelineChangeDto>>.Ok(result);
    }

    [HttpGet("site/{siteId}")]
    public async Task<ApiResponse<List<TimelineChangeDto>>> GetBySiteId(int siteId)
    {
        var result = await _service.GetBySiteIdAsync(siteId);
        return ApiResponse<List<TimelineChangeDto>>.Ok(result);
    }

    [HttpPost]
    public async Task<ApiResponse<TimelineChangeDto>> Create([FromBody] TimelineChangeCreateDto dto)
    {
        var result = await _service.CreateAsync(dto);
        return ApiResponse<TimelineChangeDto>.Ok(result, "创建成功");
    }
}
