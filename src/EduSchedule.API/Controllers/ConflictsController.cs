using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using EduSchedule.API.Models;
using EduSchedule.API.Services;
using EduSchedule.API.Enums;

namespace EduSchedule.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ConflictsController : ControllerBase
{
    private readonly IConflictDetectionService _conflictService;

    public ConflictsController(IConflictDetectionService conflictService)
    {
        _conflictService = conflictService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Conflict>>> GetConflicts(
        [FromQuery] ConflictStatus? status,
        [FromQuery] ConflictLevel? level,
        [FromQuery] int? semesterId,
        CancellationToken cancellationToken)
    {
        var conflicts = await _conflictService.GetConflictsAsync(status, level, semesterId, cancellationToken);
        return Ok(conflicts);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Conflict>> GetConflict(int id, CancellationToken cancellationToken)
    {
        var conflict = await _conflictService.GetConflictByIdAsync(id, cancellationToken);
        if (conflict == null) return NotFound();
        return Ok(conflict);
    }

    [HttpPost("{id}/assign")]
    [Authorize(Roles = "Administrator,AcademicAffairs,DepartmentHead")]
    public async Task<IActionResult> AssignTo(int id, [FromBody] AssignConflictRequest request, CancellationToken cancellationToken)
    {
        try
        {
            await _conflictService.AssignConflictToUserAsync(id, request.UserId, cancellationToken);
            return Ok(new { message = "已分配处理人" });
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost("{id}/resolve")]
    [Authorize(Roles = "Administrator,AcademicAffairs,DepartmentHead,Dean")]
    public async Task<IActionResult> Resolve(int id, [FromBody] ResolveConflictRequest request, CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out int userId)) return Unauthorized();

        try
        {
            await _conflictService.ResolveConflictAsync(id, userId, request.Resolution, cancellationToken);
            return Ok(new { message = "冲突已解决" });
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost("{id}/communications")]
    public async Task<IActionResult> AddCommunication(int id, [FromBody] AddCommunicationRequest request, CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out int userId)) return Unauthorized();

        try
        {
            await _conflictService.AddCommunicationAsync(id, userId, request.Message, request.Type, cancellationToken);
            return Ok(new { message = "消息已发送" });
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost("{id}/reviews")]
    [Authorize(Roles = "Administrator,AcademicAffairs,DepartmentHead,Dean")]
    public async Task<IActionResult> AddReview(int id, [FromBody] AddReviewRequest request, CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out int userId)) return Unauthorized();

        try
        {
            await _conflictService.AddReviewAsync(id, userId, request.Opinion, request.Result, request.Suggestions, cancellationToken);
            return Ok(new { message = "复核意见已提交" });
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost("detect-all/{semesterId}")]
    [Authorize(Roles = "Administrator,AcademicAffairs")]
    public async Task<ActionResult<IEnumerable<Conflict>>> DetectAll(int semesterId, CancellationToken cancellationToken)
    {
        var conflicts = await _conflictService.DetectAllConflictsAsync(semesterId, cancellationToken);
        return Ok(conflicts);
    }
}

public class AssignConflictRequest
{
    public int UserId { get; set; }
}

public class ResolveConflictRequest
{
    public string Resolution { get; set; } = string.Empty;
}

public class AddCommunicationRequest
{
    public string Message { get; set; } = string.Empty;
    public CommunicationType Type { get; set; } = CommunicationType.Comment;
}

public class AddReviewRequest
{
    public string Opinion { get; set; } = string.Empty;
    public ReviewResult Result { get; set; }
    public string? Suggestions { get; set; }
}
