using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ComplianceAudit.API.DTOs;
using ComplianceAudit.Core.Entities;
using ComplianceAudit.Core.Enums;
using ComplianceAudit.Core.Interfaces;
using ComplianceAudit.Infrastructure.Data;

namespace ComplianceAudit.API.Controllers;

public class CheckRecordsController : ApiControllerBase
{
    private readonly ICheckRecordService _checkRecordService;
    private readonly ApplicationDbContext _context;

    public CheckRecordsController(ICheckRecordService checkRecordService, ApplicationDbContext context)
    {
        _checkRecordService = checkRecordService;
        _context = context;
    }

    [HttpGet("schedule/{scheduleId}")]
    public async Task<IActionResult> GetByScheduleId(long scheduleId)
    {
        var records = await _context.CheckRecords
            .Include(cr => cr.ChecklistItem)
            .Include(cr => cr.SamplingRecord)
            .Include(cr => cr.Evidences)
            .Where(cr => cr.ScheduleId == scheduleId && !cr.IsDeleted)
            .OrderByDescending(cr => cr.CreatedAt)
            .ToListAsync();

        var dtos = records.Select(cr => new CheckRecordListDto
        {
            Id = cr.Id,
            ScheduleId = cr.ScheduleId,
            ChecklistItemId = cr.ChecklistItemId,
            ChecklistItemNo = cr.ChecklistItem?.ItemNo,
            SamplingRecordId = cr.SamplingRecordId,
            SamplingDocNo = cr.SamplingRecord?.DocumentNo,
            Status = (int)cr.Status,
            IsCompliant = cr.IsCompliant,
            Findings = cr.Findings,
            RiskLevel = (int)cr.RiskLevel,
            EvidenceStatus = (int)cr.EvidenceStatus,
            CheckedAt = cr.CheckedAt,
            ReviewedAt = cr.ReviewedAt,
            CreatedAt = cr.CreatedAt,
            SourceReference = cr.SourceReference,
            EvidenceCount = cr.Evidences.Count(e => !e.IsDeleted)
        });

        return OkResult(dtos);
    }

    [HttpGet("checklist-item/{checklistItemId}")]
    public async Task<IActionResult> GetByChecklistItemId(long checklistItemId)
    {
        var records = await _checkRecordService.GetCheckRecordsByChecklistItemIdAsync(checklistItemId);
        return OkResult(records);
    }

    [HttpGet("sampling/{samplingId}")]
    public async Task<IActionResult> GetBySamplingId(long samplingId)
    {
        var records = await _checkRecordService.GetCheckRecordsBySamplingIdAsync(samplingId);
        return OkResult(records);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(long id)
    {
        var record = await _checkRecordService.GetCheckRecordByIdAsync(id);
        if (record == null) return FailResult("检查记录不存在");
        return OkResult(record);
    }

    [HttpGet("trace/{documentNo}")]
    public async Task<IActionResult> GetByDocumentNo(string documentNo)
    {
        var records = await _checkRecordService.GetCheckRecordsByDocumentNoAsync(documentNo);
        return OkResult(records);
    }

    [HttpPost]
    [Authorize(Policy = "RequireAuditor")]
    public async Task<IActionResult> CreateCheckRecord([FromBody] CheckRecordCreateDto dto)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return FailResult("用户未登录");

        var record = new CheckRecord
        {
            ScheduleId = dto.ScheduleId,
            ChecklistItemId = dto.ChecklistItemId,
            SamplingRecordId = dto.SamplingRecordId,
            Findings = dto.Findings,
            AuditNotes = dto.AuditNotes,
            IsCompliant = dto.IsCompliant,
            RiskLevel = (RiskLevel)dto.RiskLevel,
            EvidenceStatus = (EvidenceStatus)dto.EvidenceStatus
        };

        var created = await _checkRecordService.CreateCheckRecordAsync(record, userId.Value);
        return OkResult(created.Id, "检查记录创建成功");
    }

    [HttpPut]
    [Authorize(Policy = "RequireAuditor")]
    public async Task<IActionResult> UpdateCheckRecord([FromBody] CheckRecordUpdateDto dto)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return FailResult("用户未登录");

        var record = new CheckRecord
        {
            Id = dto.Id,
            Findings = dto.Findings,
            AuditNotes = dto.AuditNotes,
            BusinessResponse = dto.BusinessResponse,
            IsCompliant = dto.IsCompliant,
            RiskLevel = (RiskLevel)dto.RiskLevel,
            EvidenceStatus = (EvidenceStatus)dto.EvidenceStatus,
            Status = (CheckStatus)dto.Status
        };

        var updated = await _checkRecordService.UpdateCheckRecordAsync(record, userId.Value);
        return OkResult(updated.Id, "检查记录更新成功");
    }

    [HttpPost("set-result")]
    [Authorize(Policy = "RequireAuditor")]
    public async Task<IActionResult> SetCheckRecordResult([FromBody] CheckRecordResultDto dto)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return FailResult("用户未登录");

        await _checkRecordService.SetCheckRecordResultAsync(
            dto.Id, dto.IsCompliant, dto.Findings, (RiskLevel)dto.RiskLevel, userId.Value);

        return OkResult(true, "检查结果已保存");
    }

    [HttpPost("{id}/submit")]
    [Authorize(Policy = "RequireAuditor")]
    public async Task<IActionResult> SubmitCheckRecord(long id)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return FailResult("用户未登录");

        await _checkRecordService.SubmitCheckRecordAsync(id, userId.Value);
        return OkResult(true, "检查记录已提交复核");
    }

    [HttpPost("review")]
    [Authorize(Policy = "RequireComplianceOfficer")]
    public async Task<IActionResult> ReviewCheckRecord([FromBody] CheckRecordReviewDto dto)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return FailResult("用户未登录");

        await _checkRecordService.ReviewCheckRecordAsync(
            dto.Id, userId.Value, dto.Approved, dto.ReviewComments);

        return OkResult(true, dto.Approved ? "复核通过" : "复核拒绝");
    }

    [HttpPost("bulk-update-status")]
    [Authorize(Policy = "RequireComplianceOfficer")]
    public async Task<IActionResult> BulkUpdateStatus([FromBody] BulkOperationDto dto)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return FailResult("用户未登录");

        await _checkRecordService.BulkUpdateCheckRecordStatusAsync(
            dto.Ids, (CheckStatus)dto.TargetStatus, userId.Value);

        return OkResult(true, $"批量更新成功，共{dto.Ids.Count()}条");
    }
}
