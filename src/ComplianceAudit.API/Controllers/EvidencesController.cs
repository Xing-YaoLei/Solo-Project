using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ComplianceAudit.API.DTOs;
using ComplianceAudit.Core.Entities;
using ComplianceAudit.Core.Interfaces;
using ComplianceAudit.Infrastructure.Data;

namespace ComplianceAudit.API.Controllers;

public class EvidencesController : ApiControllerBase
{
    private readonly IEvidenceService _evidenceService;
    private readonly ApplicationDbContext _context;

    public EvidencesController(IEvidenceService evidenceService, ApplicationDbContext context)
    {
        _evidenceService = evidenceService;
        _context = context;
    }

    [HttpGet("check-record/{checkRecordId}")]
    public async Task<IActionResult> GetByCheckRecordId(long checkRecordId)
    {
        var evidences = await _evidenceService.GetEvidencesByCheckRecordIdAsync(checkRecordId);
        var dtos = evidences.Select(MapToDto);
        return OkResult(dtos);
    }

    [HttpGet("checklist-item/{checklistItemId}")]
    public async Task<IActionResult> GetByChecklistItemId(long checklistItemId)
    {
        var evidences = await _evidenceService.GetEvidencesByChecklistItemIdAsync(checklistItemId);
        var dtos = evidences.Select(MapToDto);
        return OkResult(dtos);
    }

    [HttpGet("sampling/{samplingId}")]
    public async Task<IActionResult> GetBySamplingId(long samplingId)
    {
        var evidences = await _evidenceService.GetEvidencesBySamplingIdAsync(samplingId);
        var dtos = evidences.Select(MapToDto);
        return OkResult(dtos);
    }

    [HttpGet("rectification/{rectificationId}")]
    public async Task<IActionResult> GetByRectificationId(long rectificationId)
    {
        var evidences = await _evidenceService.GetEvidencesByRectificationIdAsync(rectificationId);
        var dtos = evidences.Select(MapToDto);
        return OkResult(dtos);
    }

    [HttpGet("upload-url")]
    [Authorize]
    public IActionResult GetUploadUrl([FromQuery] string fileName, [FromQuery] string contentType)
    {
        var url = _evidenceService.GeneratePresignedUploadUrl(fileName, contentType);
        return OkResult(new { UploadUrl = url.Result, FileName = fileName });
    }

    [HttpPost("attach")]
    [Authorize]
    public async Task<IActionResult> AttachEvidences([FromBody] EvidenceAttachDto dto)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return FailResult("用户未登录");

        var evidences = dto.Evidences.Select(e => new Evidence
        {
            CheckRecordId = dto.CheckRecordId,
            ChecklistItemId = dto.ChecklistItemId,
            SamplingRecordId = dto.SamplingRecordId,
            RectificationId = dto.RectificationId,
            FileName = e.FileName,
            FileUrl = e.FileUrl,
            FileSize = e.FileSize,
            ContentType = e.ContentType,
            Description = e.Description,
            IsSupplement = false
        });

        var created = await _evidenceService.AddEvidencesAsync(evidences, userId.Value);
        return OkResult(created.Count(), $"成功添加{created.Count()}个附件");
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteEvidence(long id)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return FailResult("用户未登录");

        await _evidenceService.DeleteEvidenceAsync(id, userId.Value);
        return OkResult(true, "附件删除成功");
    }

    private static EvidenceDto MapToDto(Evidence e) => new()
    {
        Id = e.Id,
        FileName = e.FileName,
        FileUrl = e.FileUrl,
        FileSize = e.FileSize,
        ContentType = e.ContentType,
        Description = e.Description,
        IsSupplement = e.IsSupplement,
        CreatedAt = e.CreatedAt
    };
}
