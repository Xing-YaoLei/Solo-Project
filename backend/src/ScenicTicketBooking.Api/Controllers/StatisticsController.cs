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

    [HttpGet("monthly/{year:int}/{month:int}")]
    [ProducesResponseType(typeof(MonthlyStatisticsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<MonthlyStatisticsDto>> GetMonthlyByPath(
        [FromRoute] int year,
        [FromRoute] int month,
        [FromQuery] Guid? scenicSpotId,
        CancellationToken cancellationToken)
    {
        var query = new StatisticsQueryDto
        {
            Year = year == 0 ? DateTime.Now.Year : year,
            Month = month == 0 ? DateTime.Now.Month : month,
            ScenicSpotId = scenicSpotId
        };

        var result = await _statisticsService.GetMonthlyStatisticsAsync(query, cancellationToken);
        return Ok(result);
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
        [FromBody] ExportBookingsPayload payload,
        CancellationToken cancellationToken = default)
    {
        var operatorName = string.IsNullOrWhiteSpace(payload.GeneratedBy) ? "System" : payload.GeneratedBy;

        var request = new ExportRequestDto
        {
            ScenicSpotId = payload.FilterCriteria?.ScenicSpotId,
            StartDate = ParseDate(payload.FilterCriteria?.StartDate),
            EndDate = ParseDate(payload.FilterCriteria?.EndDate),
            Status = payload.FilterCriteria?.Status,
            SearchKeyword = payload.FilterCriteria?.SearchKeyword,
            ExportType = "Bookings",
            FileFormat = string.IsNullOrWhiteSpace(payload.Format) ? "xlsx" : payload.Format
        };

        var (fileContent, metadata, fileName) = await _exportService.ExportBookingsAsync(
            request, operatorName, cancellationToken);

        WriteExportHeaders(metadata, fileName);
        return File(fileContent, metadata.ContentType, fileName);
    }

    [HttpPost("export/monthly-report")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(FileContentResult))]
    public async Task<IActionResult> ExportMonthlyReport(
        [FromBody] ExportMonthlyPayload payload,
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.Now;
        var operatorName = string.IsNullOrWhiteSpace(payload.GeneratedBy) ? "System" : payload.GeneratedBy;

        var query = new StatisticsQueryDto
        {
            Year = payload.FilterCriteria?.Year ?? (payload.Year == 0 ? now.Year : payload.Year),
            Month = payload.FilterCriteria?.Month ?? (payload.Month == 0 ? now.Month : payload.Month),
            ScenicSpotId = payload.FilterCriteria?.ScenicSpotId ?? payload.ScenicSpotId
        };

        var (fileContent, metadata, fileName) = await _exportService.ExportMonthlyReportAsync(
            query, operatorName, cancellationToken);

        WriteExportHeaders(metadata, fileName);
        return File(fileContent, metadata.ContentType, fileName);
    }

    private static DateOnly? ParseDate(string? s)
    {
        if (string.IsNullOrWhiteSpace(s)) return null;
        if (DateOnly.TryParse(s, out var d)) return d;
        if (DateTime.TryParse(s, out var dt)) return DateOnly.FromDateTime(dt);
        return null;
    }

    private void WriteExportHeaders(ExportMetadataDto metadata, string fileName)
    {
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
    }
}

public class ExportBookingsPayload
{
    public ExportFilterCriteria? FilterCriteria { get; set; }
    public string? Format { get; set; }
    public string? GeneratedBy { get; set; }
}

public class ExportMonthlyPayload
{
    public int Year { get; set; }
    public int Month { get; set; }
    public Guid? ScenicSpotId { get; set; }
    public ExportFilterCriteria? FilterCriteria { get; set; }
    public string? Format { get; set; }
    public string? GeneratedBy { get; set; }
}

public class ExportFilterCriteria
{
    public int? Year { get; set; }
    public int? Month { get; set; }
    public Guid? ScenicSpotId { get; set; }
    public int? Status { get; set; }
    public string? StartDate { get; set; }
    public string? EndDate { get; set; }
    public string? SearchKeyword { get; set; }
}
