using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ComplianceAudit.API.DTOs;
using ComplianceAudit.Core.Entities;
using ComplianceAudit.Core.Enums;
using ComplianceAudit.Core.Interfaces;
using ComplianceAudit.Infrastructure.Data;

namespace ComplianceAudit.API.Controllers;

public class SamplingController : ApiControllerBase
{
    private readonly ISamplingService _samplingService;
    private readonly ApplicationDbContext _context;

    public SamplingController(ISamplingService samplingService, ApplicationDbContext context)
    {
        _samplingService = samplingService;
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetSamplingRecords([FromQuery] SamplingQueryDto query)
    {
        var status = query.Status.HasValue ? (CheckStatus)query.Status.Value : null;
        var (items, totalCount) = await _samplingService.GetSamplingByScheduleIdAsync(
            query.ScheduleId, query.PageNumber, query.PageSize,
            status, query.DocumentType, query.Keyword);

        var dtos = items.Select(sr =>
        {
            var sampling = sr as SamplingRecord;
            var checkCount = sampling?.CheckRecords?.Count(cr => !cr.IsDeleted) ?? 0;
            return new SamplingListDto
            {
                Id = sr.Id,
                SamplingNo = sampling?.SamplingNo ?? string.Empty,
                SourceSystem = sampling?.SourceSystem ?? string.Empty,
                SourceModule = sampling?.SourceModule ?? string.Empty,
                DocumentNo = sampling?.DocumentNo ?? string.Empty,
                DocumentType = sampling?.DocumentType ?? string.Empty,
                DocumentDate = sampling?.DocumentDate ?? default,
                Department = sampling?.Department,
                BusinessOwner = sampling?.BusinessOwner,
                Description = sampling?.Description,
                RiskLevel = (int)(sampling?.RiskLevel ?? RiskLevel.Low),
                Status = (int)(sampling?.Status ?? CheckStatus.Pending),
                BatchNo = sampling?.BatchNo,
                Amount = sampling?.Amount,
                CreatedAt = sr.CreatedAt,
                CheckRecordCount = checkCount
            };
        });

        return OkResult(new PagedResult<SamplingListDto>
        {
            Items = dtos,
            TotalCount = totalCount,
            PageNumber = query.PageNumber,
            PageSize = query.PageSize
        });
    }

    [HttpGet("schedule/{scheduleId}/all")]
    public async Task<IActionResult> GetAllSamplingByScheduleId(long scheduleId)
    {
        var records = await _samplingService.GetAllSamplingByScheduleIdAsync(scheduleId);
        var dtos = records.Select(sr => new SamplingListDto
        {
            Id = sr.Id,
            SamplingNo = sr.SamplingNo,
            SourceSystem = sr.SourceSystem,
            SourceModule = sr.SourceModule,
            DocumentNo = sr.DocumentNo,
            DocumentType = sr.DocumentType,
            DocumentDate = sr.DocumentDate,
            Department = sr.Department,
            BusinessOwner = sr.BusinessOwner,
            Description = sr.Description,
            RiskLevel = (int)sr.RiskLevel,
            Status = (int)sr.Status,
            BatchNo = sr.BatchNo,
            Amount = sr.Amount,
            CreatedAt = sr.CreatedAt
        });

        return OkResult(dtos);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetSamplingRecord(long id)
    {
        var record = await _samplingService.GetSamplingByIdAsync(id);
        if (record == null) return FailResult("抽样记录不存在");

        var dto = new SamplingListDto
        {
            Id = record.Id,
            SamplingNo = record.SamplingNo,
            SourceSystem = record.SourceSystem,
            SourceModule = record.SourceModule,
            DocumentNo = record.DocumentNo,
            DocumentType = record.DocumentType,
            DocumentDate = record.DocumentDate,
            Department = record.Department,
            BusinessOwner = record.BusinessOwner,
            Description = record.Description,
            RiskLevel = (int)record.RiskLevel,
            Status = (int)record.Status,
            BatchNo = record.BatchNo,
            Amount = record.Amount,
            CreatedAt = record.CreatedAt
        };

        return OkResult(dto);
    }

    [HttpPost]
    [Authorize(Policy = "RequireAuditor")]
    public async Task<IActionResult> CreateSamplingRecords([FromBody] SamplingCreateDto dto)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return FailResult("用户未登录");

        var records = dto.Items.Select(i => new SamplingRecord
        {
            SourceSystem = i.SourceSystem,
            SourceModule = i.SourceModule,
            DocumentNo = i.DocumentNo,
            DocumentType = i.DocumentType,
            DocumentDate = i.DocumentDate,
            Department = i.Department,
            BusinessOwner = i.BusinessOwner,
            Description = i.Description,
            RiskLevel = (RiskLevel)i.RiskLevel,
            SamplingReason = i.SamplingReason,
            BatchNo = i.BatchNo,
            Amount = i.Amount,
            Currency = i.Currency
        });

        var created = await _samplingService.CreateSamplingRecordsAsync(dto.ScheduleId, records, userId.Value);
        return OkResult(created.Count(), $"成功创建{created.Count()}条抽样记录");
    }

    [HttpPut]
    [Authorize(Policy = "RequireAuditor")]
    public async Task<IActionResult> UpdateSamplingRecord([FromBody] SamplingUpdateDto dto)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return FailResult("用户未登录");

        var record = new SamplingRecord
        {
            Id = dto.Id,
            SourceSystem = dto.SourceSystem,
            SourceModule = dto.SourceModule,
            DocumentNo = dto.DocumentNo,
            DocumentType = dto.DocumentType,
            DocumentDate = dto.DocumentDate,
            Department = dto.Department,
            BusinessOwner = dto.BusinessOwner,
            Description = dto.Description,
            RiskLevel = (RiskLevel)dto.RiskLevel,
            Status = (CheckStatus)dto.Status,
            SamplingReason = dto.SamplingReason,
            BatchNo = dto.BatchNo,
            Amount = dto.Amount,
            Currency = dto.Currency
        };

        var updated = await _samplingService.UpdateSamplingAsync(record, userId.Value);
        return OkResult(updated.Id, "抽样记录更新成功");
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "RequireAuditor")]
    public async Task<IActionResult> DeleteSamplingRecord(long id)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return FailResult("用户未登录");

        await _samplingService.DeleteSamplingAsync(id, userId.Value);
        return OkResult(true, "抽样记录删除成功");
    }

    [HttpPost("bulk-update-status")]
    [Authorize(Policy = "RequireAuditor")]
    public async Task<IActionResult> BulkUpdateStatus([FromBody] BulkOperationDto dto)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return FailResult("用户未登录");

        await _samplingService.BulkUpdateSamplingStatusAsync(
            dto.Ids, (CheckStatus)dto.TargetStatus, userId.Value);

        return OkResult(true, $"批量更新成功，共{dto.Ids.Count()}条");
    }
}
