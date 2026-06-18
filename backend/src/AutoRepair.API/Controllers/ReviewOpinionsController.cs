using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using AutoRepair.Application.DTOs;
using AutoRepair.Application.Interfaces;

namespace AutoRepair.API.Controllers;

[Route("api/review-opinions")]
[ApiController]
[Authorize]
public class ReviewOpinionsController : ControllerBase
{
    private readonly IReviewOpinionService _reviewOpinionService;

    public ReviewOpinionsController(IReviewOpinionService reviewOpinionService)
    {
        _reviewOpinionService = reviewOpinionService;
    }

    [HttpPost]
    public async Task<ActionResult<ReviewOpinionDto>> Add([FromBody] ReviewOpinionCreateDto dto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }
        var opinion = await _reviewOpinionService.AddAsync(dto, userId);
        return Ok(opinion);
    }
}
