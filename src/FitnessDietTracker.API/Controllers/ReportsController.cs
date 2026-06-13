using FitnessDietTracker.API.Dtos;
using FitnessDietTracker.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FitnessDietTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IReportService _service;

    public ReportsController(IReportService service)
    {
        _service = service;
    }

    [HttpGet("monthly-review")]
    public async Task<ActionResult<MonthlyReviewDto>> GetMonthlyReview(
        [FromQuery] int userId,
        [FromQuery] int year,
        [FromQuery] int month)
    {
        try
        {
            return Ok(await _service.GetMonthlyReviewAsync(userId, year, month));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}
