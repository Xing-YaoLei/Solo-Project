using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ComplianceAudit.API.DTOs;
using ComplianceAudit.Core.Entities;
using ComplianceAudit.Core.Enums;
using ComplianceAudit.Core.Interfaces;
using ComplianceAudit.Infrastructure.Data;

namespace ComplianceAudit.API.Controllers;

public class ChecklistController : ApiControllerBase
{
    private readonly IChecklistService _checklistService;
    private readonly ApplicationDbContext _context;

    public ChecklistController(IChecklistService checklistService, ApplicationDbContext context)
    {
        _checklistService = checklistService;
        _context = context;
    }

    [HttpGet("schedule/{scheduleId}")]
    public async Task<IActionResult> GetChecklistByScheduleId(long scheduleId)
    {
        var items = await _context.ChecklistItems
            .Include(ci => ci.Evidences)
            .Where(ci => ci.ScheduleId == scheduleId && !ci.IsDeleted)
            .OrderBy(ci => ci.SortOrder)
            .ToListAsync();

        var dtos = items.Select(ci => new ChecklistItemDto
        {
            Id = ci.Id,
            ScheduleId = ci.ScheduleId,
            ItemNo = ci.ItemNo,
            Content = ci.Content,
            RiskLevel = (int)ci.RiskLevel,
            EvidenceRequirements = ci.EvidenceRequirements,
            SortOrder = ci.SortOrder,
            Status = (int)ci.Status,
            IsCompliant = ci.IsCompliant,
            Findings = ci.Findings,
            AuditNotes = ci.AuditNotes,
            CheckedAt = ci.CheckedAt,
            ReviewedAt = ci.ReviewedAt,
            EvidenceStatus = (int)ci.EvidenceStatus,
            EvidenceCount = ci.Evidences.Count(e => !e.IsDeleted)
        });

        return OkResult(dtos);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetChecklistItem(long id)
    {
        var item = await _checklistService.GetChecklistItemByIdAsync(id);
        if (item == null) return FailResult("检查项不存在");

        var dto = new ChecklistItemDto
        {
            Id = item.Id,
            ScheduleId = item.ScheduleId,
            ItemNo = item.ItemNo,
            Content = item.Content,
            RiskLevel = (int)item.RiskLevel,
            EvidenceRequirements = item.EvidenceRequirements,
            SortOrder = item.SortOrder,
            Status = (int)item.Status,
            IsCompliant = item.IsCompliant,
            Findings = item.Findings,
            AuditNotes = item.AuditNotes,
            CheckedAt = item.CheckedAt,
            ReviewedAt = item.ReviewedAt,
            EvidenceStatus = (int)item.EvidenceStatus
        };

        return OkResult(dto);
    }

    [HttpPut]
    [Authorize(Policy = "RequireAuditor")]
    public async Task<IActionResult> UpdateChecklistItem([FromBody] ChecklistItemUpdateDto dto)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return FailResult("用户未登录");

        var item = new ChecklistItem
        {
            Id = dto.Id,
            Content = dto.Content,
            RiskLevel = (RiskLevel)dto.RiskLevel,
            EvidenceRequirements = dto.EvidenceRequirements,
            IsCompliant = dto.IsCompliant,
            Findings = dto.Findings,
            AuditNotes = dto.AuditNotes,
            Status = (CheckStatus)dto.Status,
            EvidenceStatus = (EvidenceStatus)dto.EvidenceStatus
        };

        var updated = await _checklistService.UpdateChecklistItemAsync(item, userId.Value);
        return OkResult(updated.Id, "检查项更新成功");
    }

    [HttpPost("set-result")]
    [Authorize(Policy = "RequireAuditor")]
    public async Task<IActionResult> SetChecklistItemResult([FromBody] ChecklistItemResultDto dto)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return FailResult("用户未登录");

        await _checklistService.SetChecklistItemResultAsync(dto.ItemId, dto.IsCompliant, dto.Findings, userId.Value);
        return OkResult(true, "检查结果已保存");
    }

    [HttpPost("bulk-update-status")]
    [Authorize(Policy = "RequireAuditor")]
    public async Task<IActionResult> BulkUpdateStatus([FromBody] BulkOperationDto dto)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return FailResult("用户未登录");

        await _checklistService.BulkUpdateChecklistItemsStatusAsync(
            dto.Ids, (CheckStatus)dto.TargetStatus, userId.Value);

        return OkResult(true, $"批量更新成功，共{dto.Ids.Count()}条");
    }
}
