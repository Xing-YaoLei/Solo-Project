using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using ScenicTicketBooking.Application.Services;
using ScenicTicketBooking.Shared.DTOs;

namespace ScenicTicketBooking.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class StatisticsController : ControllerBase
{
    private readonly IStatisticsService _statisticsService;
    private readonly IExportService _exportService;

    public StatisticsController(IStatisticsService statisticsService, IExportService exportService)
    {
        _statisticsService = statisticsService;
        _exportService = exportService;
    }

    [HttpGet("monthly")]
    [ProducesResponseType(typeof(MonthlyStatisticsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<MonthlyStatisticsDto>> GetMonthly(
        [FromQuery] StatisticsQueryDto query,
        CancellationToken cancellationToken)
    {
        if (query.Year == 0) query.Year = DateTime.Now.Year;
        if (query.Month == 0) query.Month = DateTime.Now.Month;

        var result = await _statisticsService.GetMonthlyStatisticsAsync(query, cancellationToken);
        return Ok(result);
    }

    [HttpPost("export/bookings")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(FileContentResult))]
    public async Task<IActionResult> ExportBookings(
        [FromBody] ExportRequestDto request,
        [FromQuery] string operatorName = "System",
        CancellationToken cancellationToken = default)
    {
        var (fileContent, metadata, fileName) = await _exportService.ExportBookingsAsync(
            request, operatorName, cancellationToken);

        var metadataJson = JsonSerializer.Serialize(metadata, new JsonSerializerOptions
        {
            WriteIndented = true,
            Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
        });
        Response.Headers["X-Export-Metadata"] = Convert.ToBase64String(
            System.Text.Encoding.UTF8.GetBytes(metadataJson));
        Response.Headers["X-Export-Filename"] = Uri.EscapeDataString(fileName);
        Response.Headers["X-Export-Summary"] = Uri.EscapeDataString(metadata.Summary);
        Response.Headers["X-Export-GeneratedAt"] = metadata.GeneratedAt.ToString("o");
        Response.Headers["X-Export-Operator"] = Uri.EscapeDataString(metadata.GeneratedBy);

        var cd = new ContentDispositionHeaderValue("attachment")
        {
            FileNameStar = fileName
        };
        Response.Headers.ContentDisposition = cd.ToString();

        return File(fileContent, metadata.ContentType, fileName);
    }

    [HttpPost("export/monthly-report")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(FileContentResult))]
    public async Task<IActionResult> ExportMonthlyReport(
        [FromBody] StatisticsQueryDto query,
        [FromQuery] string operatorName = "System",
        CancellationToken cancellationToken = default)
    {
        if (query.Year == 0) query.Year = DateTime.Now.Year;
        if (query.Month == 0) query.Month = DateTime.Now.Month;

        var (fileContent, metadata, fileName) = await _exportService.ExportMonthlyReportAsync(
            query, operatorName, cancellationToken);

        var metadataJson = JsonSerializer.Serialize(metadata, new JsonSerializerOptions
        {
            WriteIndented = true,
            Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
        });
        Response.Headers["X-Export-Metadata"] = Convert.ToBase64String(
            System.Text.Encoding.UTF8.GetBytes(metadataJson));
        Response.Headers["X-Export-Filename"] = Uri.EscapeDataString(fileName);
        Response.Headers["X-Export-Summary"] = Uri.EscapeDataString(metadata.Summary);
        Response.Headers["X-Export-GeneratedAt"] = metadata.GeneratedAt.ToString("o");
        Response.Headers["X-Export-Operator"] = Uri.EscapeDataString(metadata.GeneratedBy);

        var cd = new ContentDispositionHeaderValue("attachment")
        {
            FileNameStar = fileName
        };
        Response.Headers.ContentDisposition = cd.ToString();

        return File(fileContent, metadata.ContentType, fileName);
    }
}
