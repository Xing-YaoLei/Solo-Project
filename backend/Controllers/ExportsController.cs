using Microsoft.AspNetCore.Mvc;
using CertSchedulePlatform.DTOs;
using CertSchedulePlatform.Entities;
using CertSchedulePlatform.Services;

namespace CertSchedulePlatform.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ExportsController : ControllerBase
{
    private readonly IExportService _exportService;

    public ExportsController(IExportService exportService)
    {
        _exportService = exportService;
    }

    [HttpPost("learning-progress")]
    public async Task<ActionResult<ExportRecordDto>> ExportLearningProgress([FromBody] ExportRequestDto request)
    {
        request.ExportType = ExportType.LearningProgress;
        var result = await _exportService.ExportLearningProgressAsync(request);
        return Ok(result);
    }

    [HttpPost("monthly-review")]
    public async Task<ActionResult<ExportRecordDto>> ExportMonthlyReview([FromBody] ExportRequestDto request)
    {
        request.ExportType = ExportType.MonthlyReview;
        var result = await _exportService.ExportMonthlyReviewAsync(request);
        return Ok(result);
    }

    [HttpPost("assignments")]
    public async Task<ActionResult<ExportRecordDto>> ExportAssignments([FromBody] ExportRequestDto request)
    {
        request.ExportType = ExportType.AssignmentRecords;
        var result = await _exportService.ExportAssignmentRecordsAsync(request);
        return Ok(result);
    }

    [HttpPost("alerts")]
    public async Task<ActionResult<ExportRecordDto>> ExportAlerts([FromBody] ExportRequestDto request)
    {
        request.ExportType = ExportType.Alerts;
        var result = await _exportService.ExportAlertsAsync(request);
        return Ok(result);
    }

    [HttpGet("{id}/download")]
    public async Task<IActionResult> Download(int id)
    {
        try
        {
            var fileBytes = await _exportService.DownloadExportAsync(id);
            var fileName = $"export_{id}.xlsx";
            return File(fileBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        }
        catch (FileNotFoundException)
        {
            return NotFound("导出文件不存在");
        }
    }

    [HttpGet("history")]
    public async Task<ActionResult<PagedResult<ExportRecordDto>>> GetHistory(
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] ExportType? type = null)
    {
        var result = await _exportService.GetExportHistoryAsync(pageIndex, pageSize, type);
        return Ok(result);
    }
}
