using ColdChainScheduler.Domain.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ColdChainScheduler.API.Controllers;

[ApiController]
[Route("api/[controller]")]
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
    public async Task<IActionResult> ExportExceptions([FromBody] int[] orderIds)
    {
        if (orderIds == null || orderIds.Length == 0)
            return BadRequest(new { message = "请选择要导出的异常工单" });

        var bytes = await _exportService.ExportExceptionOrdersAsync(orderIds);
        return File(bytes,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            $"异常工单_{DateTime.Now:yyyyMMddHHmmss}.xlsx");
    }

    [HttpGet("caliber/{type}")]
    public IActionResult GetCaliberDescription(string type)
    {
        var description = _exportService.GetCaliberDescription(type);
        return Ok(new { exportType = type, caliberDescription = description });
    }
}
