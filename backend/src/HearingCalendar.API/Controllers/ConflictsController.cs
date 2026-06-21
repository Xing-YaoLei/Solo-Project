using System.Security.Claims;
using HearingCalendar.Application.Dtos;
using HearingCalendar.Application.Interfaces;
using HearingCalendar.Domain.Enums;
using HearingCalendar.API.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HearingCalendar.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ConflictsController : ControllerBase
{
    private readonly IConflictService _conflictService;

    public ConflictsController(IConflictService conflictService)
    {
        _conflictService = conflictService;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ConflictResponse>> GetById(Guid id)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        Guid? callerUserId = userIdClaim is not null ? Guid.Parse(userIdClaim) : null;
        var result = await _conflictService.GetByIdAsync(id, callerUserId);
        return Ok(result);
    }

    [HttpGet("hearing/{hearingId}")]
    public async Task<ActionResult<IEnumerable<ConflictResponse>>> GetByHearing(Guid hearingId)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        Guid? callerUserId = userIdClaim is not null ? Guid.Parse(userIdClaim) : null;
        var result = await _conflictService.GetByHearingAsync(hearingId, callerUserId);
        return Ok(result);
    }

    [HttpGet("active")]
    public async Task<ActionResult<IEnumerable<ConflictResponse>>> GetActive()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        Guid? callerUserId = userIdClaim is not null ? Guid.Parse(userIdClaim) : null;
        var result = await _conflictService.GetActiveConflictsAsync(callerUserId);
        return Ok(result);
    }

    [HttpPost]
    [RoleAuthorize(UserRole.Partner, UserRole.Lawyer)]
    public async Task<ActionResult<ConflictResponse>> Create([FromBody] CreateConflictRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _conflictService.CreateAsync(request, userId);
        return Ok(result);
    }

    [HttpPut("{id}/resolve")]
    [RoleAuthorize(UserRole.Partner)]
    public async Task<ActionResult<ConflictResponse>> Resolve(Guid id, [FromBody] ResolveConflictRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _conflictService.ResolveAsync(id, request, userId);
        return Ok(result);
    }
}
