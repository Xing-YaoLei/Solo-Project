using FitnessDietTracker.API.Dtos;
using FitnessDietTracker.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FitnessDietTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ExportsController : ControllerBase
{
    private readonly IExportService _service;

    public ExportsController(IExportService service)
    {
        _service = service;
    }

    [HttpPost]
    public async Task<IActionResult> Export([FromBody] ExportRequestDto dto, [FromQuery] int operatorId)
    {
        try
        {
            var result = await _service.ExportAsync(dto, operatorId);
            return File(result.FileBytes, result.ContentType, result.FileName);
        }
        catch (NotSupportedException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("history")]
    public async Task<ActionResult<List<ExportRecordDto>>> GetHistory([FromQuery] int? operatorId)
    {
        return Ok(await _service.GetExportHistoryAsync(operatorId));
    }
}
