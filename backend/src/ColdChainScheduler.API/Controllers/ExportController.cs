using ColdChainScheduler.Domain.Common;
using ColdChainScheduler.Domain.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ColdChainScheduler.API.Controllers;

[ApiController]
[Route("api/export")]
public class ExportController : ControllerBase
{
    private readonly IExportService _exportService;

    public ExportController(IExportService exportService)
    {
        _exportService = exportService;
    }

    [HttpGet("settlement/{id}")]
    public async Task<IActionResult> ExportSettlement(int id)
    {
        var bytes = await _exportService.ExportSettlementSheetAsync(id);
        return File(bytes,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            $"结算单_{id}_{DateTime.Now:yyyyMMddHHmmss}.xlsx");
    }

    [HttpGet("arrival/{id}")]
    public async Task<IActionResult> ExportArrival(int id)
    {
        var bytes = await _exportService.ExportArrivalListAsync(id);
        return File(bytes,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            $"到货清单_{id}_{DateTime.Now:yyyyMMddHHmmss}.xlsx");
    }

    [HttpPost("exceptions")]
    public async Task<IActionResult> ExportExceptions([FromBody] ExportExceptionsRequest request)
    {
        if (request == null || request.Ids == null || request.Ids.Length == 0)
            return Ok(ApiResponse.Fail("请选择要导出的异常工单"));

        var bytes = await _exportService.ExportExceptionOrdersAsync(request.Ids);
        return File(bytes,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            $"异常工单_{DateTime.Now:yyyyMMddHHmmss}.xlsx");
    }

    [HttpGet("caliber-description/{type}")]
    public ActionResult<ApiResponse<string>> GetCaliberDescription(string type)
    {
        var description = _exportService.GetCaliberDescription(type);
        return Ok(ApiResponse.Ok(description));
    }

    [HttpGet("settlement/{id}/caliber")]
    public ActionResult<ApiResponse<string>> GetSettlementCaliber(int id)
    {
        var description = _exportService.GetCaliberDescription("settlement");
        return Ok(ApiResponse.Ok(description));
    }

    [HttpGet("arrival/{id}/caliber")]
    public ActionResult<ApiResponse<string>> GetArrivalCaliber(int id)
    {
        var description = _exportService.GetCaliberDescription("arrival");
        return Ok(ApiResponse.Ok(description));
    }

    [HttpGet("exceptions/caliber")]
    public ActionResult<ApiResponse<string>> GetExceptionsCaliber()
    {
        var description = _exportService.GetCaliberDescription("exception");
        return Ok(ApiResponse.Ok(description));
    }
}

public class ExportExceptionsRequest
{
    public int[] Ids { get; set; } = Array.Empty<int>();
}
