using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ComplianceAudit.API.DTOs;
using ComplianceAudit.Core.Entities;
using ComplianceAudit.Core.Enums;
using ComplianceAudit.Core.Interfaces;
using ComplianceAudit.Infrastructure.Data;

namespace ComplianceAudit.API.Controllers;

public class EvidenceMissingController : ApiControllerBase
{
    private readonly IEvidenceMissingService _evidenceMissingService;
    private readonly ApplicationDbContext _context;

    public EvidenceMissingController(IEvidenceMissingService evidenceMissingService, ApplicationDbContext context)
    {
        _evidenceMissingService = evidenceMissingService;
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetEvidenceMissingRecords([FromQuery] EvidenceMissingQueryDto query)
    {
        var userId = GetCurrentUserId();
        var status = query.Status.HasValue ? (EvidenceStatus)query.Status.Value : null;

        var (items, totalCount) = await _evidenceMissingService.GetEvidenceMissingRecordsAsync(
            query.PageNumber, query.PageSize,
            status, query.ResponsibleId,
            query.MyAssigned, userId);

        var dtos = items.Select(emr =>
        {
            var record = emr as EvidenceMissingRecord;
            return new EvidenceMissingListDto
            {
                Id = emr.Id,
                MissingNo = record?.MissingNo ?? string.Empty,
                CheckRecordId = record?.CheckRecordId ?? 0,
                ChecklistItemId = record?.ChecklistItemId,
                Status = (int)(record?.Status ?? EvidenceStatus.Missing),
                MissingDescription = record?.MissingDescription ?? string.Empty,
                RequestedById = record?.RequestedById ?? 0,
                ResponsibleId = record?.ResponsibleId,
                ResponsibleName = record?.Responsible?.FullName,
                RequestedAt = record?.RequestedAt ?? default,
                Deadline = record?.Deadline,
                SuppliedAt = record?.SuppliedAt,
                IsWaived = record?.IsWaived,
                EvidenceCount = record?.SuppliedEvidences?.Count(e => !e.IsDeleted) ?? 0
            };
        });

        return OkResult(new PagedResult<EvidenceMissingListDto>
        {
            Items = dtos,
            TotalCount = totalCount,
            PageNumber = query.PageNumber,
            PageSize = query.PageSize
        });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(long id)
    {
        var record = await _context.EvidenceMissingRecords
            .Include(emr => emr.RequestedBy)
            .Include(emr => emr.Responsible)
            .Include(emr => emr.SuppliedEvidences)
            .FirstOrDefaultAsync(emr => emr.Id == id && !emr.IsDeleted);

        if (record == null) return FailResult("证据缺失记录不存在");
        return OkResult(record);
    }

    [HttpGet("check-record/{checkRecordId}")]
    public async Task<IActionResult> GetByCheckRecordId(long checkRecordId)
    {
        var records = await _evidenceMissingService.GetByCheckRecordIdAsync(checkRecordId);
        return OkResult(records);
    }

    [HttpGet("schedule/{scheduleId}")]
    public async Task<IActionResult> GetByScheduleId(long scheduleId)
    {
        var records = await _evidenceMissingService.GetByScheduleIdAsync(scheduleId);
        return OkResult(records);
    }

    [HttpPost]
    [Authorize(Policy = "RequireAuditor")]
    public async Task<IActionResult> CreateEvidenceMissing([FromBody] EvidenceMissingCreateDto dto)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return FailResult("用户未登录");

        var record = new EvidenceMissingRecord
        {
            CheckRecordId = dto.CheckRecordId,
            ChecklistItemId = dto.ChecklistItemId,
            MissingDescription = dto.MissingDescription,
            ResponsibleId = dto.ResponsibleId
        };

        var created = await _evidenceMissingService.CreateEvidenceMissingRecordAsync(record, userId.Value);
        return OkResult(created.Id, "证据缺失记录创建成功");
    }

    [HttpPost("request-supplement")]
    [Authorize(Policy = "RequireAuditor")]
    public async Task<IActionResult> RequestSupplement([FromBody] EvidenceMissingRequestDto dto)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return FailResult("用户未登录");

        await _evidenceMissingService.RequestSupplementAsync(
            dto.Id, dto.Description, dto.ResponsibleId, dto.Deadline, userId.Value);

        return OkResult(true, "已发起补充证据请求");
    }

    [HttpPost("provide-evidence")]
    [Authorize(Policy = "RequireBusinessOwner")]
    public async Task<IActionResult> ProvideEvidence([FromBody] EvidenceMissingSupplyDto dto)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return FailResult("用户未登录");

        var evidences = dto.Evidences.Select(e => new Evidence
        {
            FileName = e.FileName,
            FileUrl = e.FileUrl,
            FileSize = e.FileSize,
            ContentType = e.ContentType,
            Description = e.Description,
            IsSupplement = true
        });

        await _evidenceMissingService.ProvideEvidenceAsync(
            dto.Id, dto.SupplierComments, evidences, userId.Value);

        return OkResult(true, "补充证据已提交");
    }

    [HttpPost("review")]
    [Authorize(Policy = "RequireComplianceOfficer")]
    public async Task<IActionResult> ReviewEvidence([FromBody] EvidenceMissingReviewDto dto)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return FailResult("用户未登录");

        await _evidenceMissingService.ReviewSuppliedEvidenceAsync(
            dto.Id, (EvidenceStatus)dto.NewStatus, dto.ReviewerComments, userId.Value);

        return OkResult(true, "证据复核完成");
    }

    [HttpPost("waive")]
    [Authorize(Policy = "RequireManagement")]
    public async Task<IActionResult> WaiveRequirement([FromBody] EvidenceMissingWaiveDto dto)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return FailResult("用户未登录");

        await _evidenceMissingService.WaiveEvidenceRequirementAsync(dto.Id, dto.WaiveReason, userId.Value);
        return OkResult(true, "证据要求已豁免");
    }
}
