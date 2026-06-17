using Microsoft.AspNetCore.Mvc;
using SiteSchedule.Dtos.ActionLog;
using SiteSchedule.Dtos.Common;
using SiteSchedule.Services;

namespace SiteSchedule.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ActionLogsController : ControllerBase
{
    private readonly IActionLogService _service;

    public ActionLogsController(IActionLogService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ApiResponse<PagedResult<ActionLogDto>>> GetPagedList([FromQuery] ActionLogQueryDto query)
    {
        var result = await _service.GetPagedListAsync(query);
        return ApiResponse<PagedResult<ActionLogDto>>.Ok(result);
    }

    [HttpGet("site/{siteId}")]
    public async Task<ApiResponse<List<ActionLogDto>>> GetBySiteId(int siteId)
    {
        var result = await _service.GetBySiteIdAsync(siteId);
        return ApiResponse<List<ActionLogDto>>.Ok(result);
    }
}
