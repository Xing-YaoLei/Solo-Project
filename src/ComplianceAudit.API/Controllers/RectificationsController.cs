using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ComplianceAudit.API.DTOs;
using ComplianceAudit.Core.Entities;
using ComplianceAudit.Core.Enums;
using ComplianceAudit.Core.Interfaces;
using ComplianceAudit.Infrastructure.Data;

namespace ComplianceAudit.API.Controllers;

public class RectificationsController : ApiControllerBase
{
    private readonly IRectificationService _rectificationService;
    private readonly ApplicationDbContext _context;

    public RectificationsController(IRectificationService rectificationService, ApplicationDbContext context)
    {
        _rectificationService = rectificationService;
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetRectifications([FromQuery] RectificationQueryDto query)
    {
        var userId = GetCurrentUserId();
        var status = query.Status.HasValue ? (RectificationStatus)query.Status.Value : null;
        var riskLevel = query.RiskLevel.HasValue ? (RiskLevel)query.RiskLevel.Value : null;

        var (items, totalCount) = await _rectificationService.GetRectificationsAsync(
            query.PageNumber, query.PageSize,
            query.ScheduleId, query.OwnerId,
            status, riskLevel,
            query.MyAssigned, userId);

        var dtos = items.Select(r =>
        {
            var rect = r as Rectification;
            return new RectificationListDto
            {
                Id = r.Id,
                RectificationNo = rect?.RectificationNo ?? string.Empty,
                ScheduleId = rect?.ScheduleId ?? 0,
                ScheduleTitle = rect?.Schedule?.Title ?? string.Empty,
                CheckRecordId = rect?.CheckRecordId,
                Title = rect?.Title ?? string.Empty,
                OwnerId = rect?.OwnerId ?? 0,
                OwnerName = rect?.Owner?.FullName ?? string.Empty,
                Deadline = rect?.Deadline ?? default,
                Status = (int)(rect?.Status ?? RectificationStatus.NotStarted),
                RiskLevel = (int)(rect?.RiskLevel ?? RiskLevel.Low),
                CreatedAt = r.CreatedAt
            };
        });

        return OkResult(new PagedResult<RectificationListDto>
        {
            Items = dtos,
            TotalCount = totalCount,
            PageNumber = query.PageNumber,
            PageSize = query.PageSize
        });
    }

    [HttpGet("schedule/{scheduleId}")]
    public async Task<IActionResult> GetByScheduleId(long scheduleId)
    {
        var rectifications = await _rectificationService.GetRectificationsByScheduleIdAsync(scheduleId);
        var dtos = rectifications.Select(r => new RectificationListDto
        {
            Id = r.Id,
            RectificationNo = r.RectificationNo,
            ScheduleId = r.ScheduleId,
            CheckRecordId = r.CheckRecordId,
            Title = r.Title,
            OwnerId = r.OwnerId,
            Deadline = r.Deadline,
            Status = (int)r.Status,
            RiskLevel = (int)r.RiskLevel,
            CreatedAt = r.CreatedAt
        });

        return OkResult(dtos);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(long id)
    {
        var rectification = await _context.Rectifications
            .Include(r => r.Owner)
            .Include(r => r.Evidences)
            .FirstOrDefaultAsync(r => r.Id == id && !r.IsDeleted);

        if (rectification == null) return FailResult("整改计划不存在");

        return OkResult(rectification);
    }

    [HttpPost]
    [Authorize(Policy = "RequireAuditor")]
    public async Task<IActionResult> CreateRectification([FromBody] RectificationCreateDto dto)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return FailResult("用户未登录");

        var rectification = new Rectification
        {
            ScheduleId = dto.ScheduleId,
            CheckRecordId = dto.CheckRecordId,
            Title = dto.Title,
            Description = dto.Description,
            RootCause = dto.RootCause,
            ActionPlan = dto.ActionPlan,
            OwnerId = dto.OwnerId,
            Deadline = dto.Deadline,
            RiskLevel = (RiskLevel)dto.RiskLevel,
            Remarks = dto.Remarks
        };

        var created = await _rectificationService.CreateRectificationAsync(rectification, userId.Value);
        return OkResult(created.Id, "整改计划创建成功");
    }

    [HttpPut]
    [Authorize(Policy = "RequireBusinessOwner")]
    public async Task<IActionResult> UpdateRectification([FromBody] RectificationUpdateDto dto)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return FailResult("用户未登录");

        var rectification = new Rectification
        {
            Id = dto.Id,
            Title = dto.Title,
            Description = dto.Description,
            RootCause = dto.RootCause,
            ActionPlan = dto.ActionPlan,
            OwnerId = dto.OwnerId,
            Deadline = dto.Deadline,
            RiskLevel = (RiskLevel)dto.RiskLevel,
            CorrectiveAction = dto.CorrectiveAction,
            PreventiveAction = dto.PreventiveAction,
            Remarks = dto.Remarks
        };

        var updated = await _rectificationService.UpdateRectificationAsync(rectification, userId.Value);
        return OkResult(updated.Id, "整改计划更新成功");
    }

    [HttpPost("{id}/update-status")]
    [Authorize(Policy = "RequireBusinessOwner")]
    public async Task<IActionResult> UpdateStatus(long id, [FromBody] int status, [FromQuery] string? remarks)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return FailResult("用户未登录");

        await _rectificationService.UpdateStatusAsync(id, (RectificationStatus)status, userId.Value, remarks);
        return OkResult(true, "状态更新成功");
    }

    [HttpPost("{id}/submit")]
    [Authorize(Policy = "RequireBusinessOwner")]
    public async Task<IActionResult> SubmitForReview(long id)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return FailResult("用户未登录");

        await _rectificationService.SubmitForReviewAsync(id, userId.Value);
        return OkResult(true, "整改完成，已提交复核");
    }

    [HttpPost("verify")]
    [Authorize(Policy = "RequireComplianceOfficer")]
    public async Task<IActionResult> VerifyRectification([FromBody] RectificationVerifyDto dto)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return FailResult("用户未登录");

        await _rectificationService.VerifyAsync(dto.Id, dto.VerificationResult, dto.IsVerified, userId.Value);
        return OkResult(true, dto.IsVerified ? "整改验证通过" : "整改验证未通过");
    }

    [HttpPost("{id}/close")]
    [Authorize(Policy = "RequireManagement")]
    public async Task<IActionResult> CloseRectification(long id)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return FailResult("用户未登录");

        await _rectificationService.CloseAsync(id, userId.Value);
        return OkResult(true, "整改计划已关闭");
    }
}
