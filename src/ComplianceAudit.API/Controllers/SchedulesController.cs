using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ComplianceAudit.API.DTOs;
using ComplianceAudit.Core.Entities;
using ComplianceAudit.Core.Enums;
using ComplianceAudit.Core.Interfaces;
using Microsoft.EntityFrameworkCore;
using ComplianceAudit.Infrastructure.Data;

namespace ComplianceAudit.API.Controllers;

public class SchedulesController : ApiControllerBase
{
    private readonly IAuditScheduleService _scheduleService;
    private readonly IChecklistService _checklistService;
    private readonly ApplicationDbContext _context;

    public SchedulesController(
        IAuditScheduleService scheduleService,
        IChecklistService checklistService,
        ApplicationDbContext context)
    {
        _scheduleService = scheduleService;
        _checklistService = checklistService;
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetSchedules([FromQuery] ScheduleQueryDto query)
    {
        var status = query.Status.HasValue ? (CheckStatus)query.Status.Value : null;
        var riskLevel = query.RiskLevel.HasValue ? (RiskLevel)query.RiskLevel.Value : null;

        var (items, totalCount) = await _scheduleService.GetSchedulesAsync(
            query.PageNumber, query.PageSize,
            query.AuditorId, query.BusinessOwnerId,
            status, riskLevel,
            query.StartDateFrom, query.StartDateTo);

        var dtos = items.Select(s => new ScheduleListDto
        {
            Id = s.Id,
            ScheduleNo = s.ScheduleNo,
            Title = s.Title,
            RegulationId = s.RegulationId,
            RegulationName = s.Regulation?.Title ?? string.Empty,
            AuditorId = s.AuditorId,
            AuditorName = s.Auditor?.FullName ?? string.Empty,
            BusinessOwnerId = s.BusinessOwnerId,
            BusinessOwnerName = s.BusinessOwner?.FullName,
            Frequency = (int)s.Frequency,
            StartDate = s.StartDate,
            EndDate = s.EndDate,
            DueDate = s.DueDate,
            RiskLevel = (int)s.RiskLevel,
            Status = (int)s.Status,
            CreatedAt = s.CreatedAt
        });

        return OkResult(new PagedResult<ScheduleListDto>
        {
            Items = dtos,
            TotalCount = totalCount,
            PageNumber = query.PageNumber,
            PageSize = query.PageSize
        });
    }

    [HttpGet("mine")]
    public async Task<IActionResult> GetMySchedules()
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole() ?? AuditRole.Auditor;
        if (!userId.HasValue) return FailResult("用户未登录");

        var schedules = await _scheduleService.GetMySchedulesAsync(userId.Value, role);
        var dtos = schedules.Select(s => new ScheduleListDto
        {
            Id = s.Id,
            ScheduleNo = s.ScheduleNo,
            Title = s.Title,
            RegulationId = s.RegulationId,
            AuditorId = s.AuditorId,
            Frequency = (int)s.Frequency,
            StartDate = s.StartDate,
            EndDate = s.EndDate,
            DueDate = s.DueDate,
            RiskLevel = (int)s.RiskLevel,
            Status = (int)s.Status,
            CreatedAt = s.CreatedAt
        });

        return OkResult(dtos);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetSchedule(long id)
    {
        var schedule = await _context.AuditSchedules
            .Include(s => s.Regulation)
            .Include(s => s.Auditor)
            .Include(s => s.BusinessOwner)
            .Include(s => s.ChecklistItems)
            .Include(s => s.SamplingRecords)
            .Include(s => s.CheckRecords)
            .Include(s => s.Rectifications)
            .FirstOrDefaultAsync(s => s.Id == id && !s.IsDeleted);

        if (schedule == null) return FailResult("排程不存在");

        var dto = new ScheduleDetailDto
        {
            Id = schedule.Id,
            ScheduleNo = schedule.ScheduleNo,
            Title = schedule.Title,
            Description = schedule.Description,
            RegulationId = schedule.RegulationId,
            RegulationName = schedule.Regulation?.Title ?? string.Empty,
            AuditorId = schedule.AuditorId,
            AuditorName = schedule.Auditor?.FullName ?? string.Empty,
            BusinessOwnerId = schedule.BusinessOwnerId,
            BusinessOwnerName = schedule.BusinessOwner?.FullName,
            Frequency = (int)schedule.Frequency,
            StartDate = schedule.StartDate,
            EndDate = schedule.EndDate,
            DueDate = schedule.DueDate,
            RiskLevel = (int)schedule.RiskLevel,
            Status = (int)schedule.Status,
            Scope = schedule.Scope,
            Remarks = schedule.Remarks,
            CreatedAt = schedule.CreatedAt,
            ChecklistItemCount = schedule.ChecklistItems.Count(ci => !ci.IsDeleted),
            SamplingRecordCount = schedule.SamplingRecords.Count(sr => !sr.IsDeleted),
            CheckRecordCount = schedule.CheckRecords.Count(cr => !cr.IsDeleted),
            RectificationCount = schedule.Rectifications.Count(r => !r.IsDeleted)
        };

        return OkResult(dto);
    }

    [HttpPost]
    [Authorize(Policy = "RequireAuditor")]
    public async Task<IActionResult> CreateSchedule([FromBody] ScheduleCreateDto dto)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return FailResult("用户未登录");

        var schedule = new AuditSchedule
        {
            Title = dto.Title,
            Description = dto.Description,
            RegulationId = dto.RegulationId,
            AuditorId = dto.AuditorId,
            BusinessOwnerId = dto.BusinessOwnerId,
            Frequency = (ScheduleFrequency)dto.Frequency,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            DueDate = dto.DueDate,
            RiskLevel = (RiskLevel)dto.RiskLevel,
            Scope = dto.Scope,
            Remarks = dto.Remarks
        };

        var created = await _scheduleService.CreateScheduleAsync(schedule, userId.Value);
        return OkResult(created.Id, "排程创建成功");
    }

    [HttpPut]
    [Authorize(Policy = "RequireAuditor")]
    public async Task<IActionResult> UpdateSchedule([FromBody] ScheduleUpdateDto dto)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return FailResult("用户未登录");

        var schedule = new AuditSchedule
        {
            Id = dto.Id,
            Title = dto.Title,
            Description = dto.Description,
            RegulationId = dto.RegulationId,
            AuditorId = dto.AuditorId,
            BusinessOwnerId = dto.BusinessOwnerId,
            Frequency = (ScheduleFrequency)dto.Frequency,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            DueDate = dto.DueDate,
            RiskLevel = (RiskLevel)dto.RiskLevel,
            Scope = dto.Scope,
            Remarks = dto.Remarks
        };

        var updated = await _scheduleService.UpdateScheduleAsync(schedule, userId.Value);
        return OkResult(updated.Id, "排程更新成功");
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "RequireAuditor")]
    public async Task<IActionResult> DeleteSchedule(long id)
 {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return FailResult("用户未登录");

        await _scheduleService.DeleteScheduleAsync(id, userId.Value);
        return OkResult(true, "排程删除成功");
    }

    [HttpPost("{id}/start")]
    [Authorize(Policy = "RequireAuditor")]
    public async Task<IActionResult> StartSchedule(long id)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return FailResult("用户未登录");

        await _scheduleService.StartScheduleAsync(id, userId.Value);
        return OkResult(true, "排程已开始");
    }

    [HttpPost("{id}/submit")]
    [Authorize(Policy = "RequireAuditor")]
    public async Task<IActionResult> SubmitSchedule(long id)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return FailResult("用户未登录");

        await _scheduleService.SubmitScheduleAsync(id, userId.Value);
        return OkResult(true, "排程已提交复核");
    }

    [HttpPost("review")]
    [Authorize(Policy = "RequireComplianceOfficer")]
    public async Task<IActionResult> ReviewSchedule([FromBody] ScheduleReviewDto dto)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return FailResult("用户未登录");

        await _scheduleService.ReviewScheduleAsync(dto.Id, userId.Value, dto.Approved, dto.Comments);
        return OkResult(true, dto.Approved ? "排程复核通过" : "排程复核拒绝");
    }

    [HttpPost("{id}/close")]
    [Authorize(Policy = "RequireManagement")]
    public async Task<IActionResult> CloseSchedule(long id)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return FailResult("用户未登录");

        await _scheduleService.CloseScheduleAsync(id, userId.Value);
        return OkResult(true, "排程已关闭");
    }

    [HttpPost("generate-checklist")]
    [Authorize(Policy = "RequireAuditor")]
    public async Task<IActionResult> GenerateChecklist([FromBody] ChecklistGenerateDto dto)
    {
        await _checklistService.GenerateChecklistFromTemplateAsync(dto.ScheduleId, dto.TemplateId);
        return OkResult(true, "检查清单已生成");
    }
}
