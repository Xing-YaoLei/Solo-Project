using Microsoft.AspNetCore.Mvc;
using CertSchedulePlatform.DTOs;
using CertSchedulePlatform.Services;

namespace CertSchedulePlatform.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MonthlyReviewController : ControllerBase
{
    private readonly IMonthlyReviewService _reviewService;

    public MonthlyReviewController(IMonthlyReviewService reviewService)
    {
        _reviewService = reviewService;
    }

    [HttpGet]
    public async Task<ActionResult<MonthlyReviewDto>> GetReview(
        [FromQuery] int year,
        [FromQuery] int month,
        [FromQuery] int? certificateId = null,
        [FromQuery] int? courseId = null)
    {
        var query = new MonthlyReviewQueryDto
        {
            Year = year,
            Month = month,
            CertificateId = certificateId,
            CourseId = courseId
        };

        var review = await _reviewService.GetMonthlyReviewAsync(query);
        return Ok(review);
    }

    [HttpGet("courses")]
    public async Task<ActionResult<List<CourseReviewDto>>> GetCourseReviews(
        [FromQuery] int year,
        [FromQuery] int month,
        [FromQuery] int certificateId)
    {
        var reviews = await _reviewService.GetCourseReviewsAsync(year, month, certificateId);
        return Ok(reviews);
    }
}
