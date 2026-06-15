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
public class ApprovalsController : ControllerBase
{
    private readonly IApprovalService _approvalService;

    public ApprovalsController(IApprovalService approvalService)
    {
        _approvalService = approvalService;
    }

    [HttpGet("pending")]
    [Authorize(Roles = "Administrator,AcademicAffairs,DepartmentHead,Dean")]
    public async Task<ActionResult<IEnumerable<ApprovalRecord>>> GetPendingApprovals(
        [FromQuery] int? approverId,
        [FromQuery] int? level,
        CancellationToken cancellationToken)
    {
        var approvals = await _approvalService.GetPendingApprovalsAsync(approverId, level, cancellationToken);
        return Ok(approvals);
    }

    [HttpGet("schedule/{scheduleId}")]
    public async Task<ActionResult<IEnumerable<ApprovalRecord>>> GetApprovalRecords(int scheduleId, CancellationToken cancellationToken)
    {
        var records = await _approvalService.GetApprovalRecordsByScheduleIdAsync(scheduleId, cancellationToken);
        return Ok(records);
    }

    [HttpGet("statistics")]
    [Authorize(Roles = "Administrator,AcademicAffairs,DepartmentHead,Dean")]
    public async Task<ActionResult<ApprovalStatisticsDto>> GetStatistics(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        CancellationToken cancellationToken)
    {
        var stats = await _approvalService.GetApprovalStatisticsAsync(startDate, endDate, cancellationToken);
        return Ok(stats);
    }

    [HttpGet("trend")]
    [Authorize(Roles = "Administrator,AcademicAffairs,DepartmentHead,Dean")]
    public async Task<ActionResult<IEnumerable<ApprovalTrendDto>>> GetTrend(
        [FromQuery] int days = 30,
        CancellationToken cancellationToken)
    {
        var trend = await _approvalService.GetApprovalTrendAsync(days, cancellationToken);
        return Ok(trend);
    }

    [HttpGet("todos")]
    public async Task<ActionResult<IEnumerable<TodoItemDto>>> GetMyTodos(CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;

        if (!int.TryParse(userIdClaim, out int userId) || !Enum.TryParse<RoleType>(roleClaim, out var role))
        {
            return Unauthorized();
        }

        var todos = await _approvalService.GetUserTodosAsync(userId, role, cancellationToken);
        return Ok(todos);
    }
}
