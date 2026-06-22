using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ComplianceAudit.API.DTOs;
using ComplianceAudit.Core.Entities;
using ComplianceAudit.Core.Enums;
using ComplianceAudit.Infrastructure.Data;

namespace ComplianceAudit.API.Controllers;

public class RegulationsController : ApiControllerBase
{
    private readonly ApplicationDbContext _context;

    public RegulationsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetRegulations([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20, [FromQuery] string? keyword = null, [FromQuery] string? category = null)
    {
        var query = _context.Regulations.Where(r => !r.IsDeleted && r.IsActive);

        if (!string.IsNullOrEmpty(keyword))
            query = query.Where(r => r.Title.Contains(keyword) || r.RegulationNo.Contains(keyword) || r.Tags != null && r.Tags.Contains(keyword));

        if (!string.IsNullOrEmpty(category))
            query = query.Where(r => r.Category == category);

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return OkResult(new PagedResult<Regulation>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetRegulation(long id)
    {
        var regulation = await _context.Regulations
            .Include(r => r.ChecklistTemplates)
            .ThenInclude(t => t.Items)
            .FirstOrDefaultAsync(r => r.Id == id && !r.IsDeleted);

        if (regulation == null) return FailResult("制度不存在");
        return OkResult(regulation);
    }

    [HttpGet("{id}/templates")]
    public async Task<IActionResult> GetTemplatesByRegulationId(long id)
    {
        var templates = await _context.ChecklistTemplates
            .Include(t => t.Items)
            .Where(t => t.RegulationId == id && !t.IsDeleted && t.IsActive)
            .ToListAsync();

        return OkResult(templates);
    }
}

public class ProcessingHistoriesController : ApiControllerBase
{
    private readonly ApplicationDbContext _context;

    public ProcessingHistoriesController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetProcessingHistories([FromQuery] ProcessingHistoryQueryDto query)
    {
        var userId = GetCurrentUserId();
        var queryable = _context.ProcessingHistories
            .Include(ph => ph.Operator)
            .Where(ph => ph.EntityType == query.EntityType && ph.EntityId == query.EntityId);

        var totalCount = await queryable.CountAsync();
        var items = await queryable
            .OrderByDescending(ph => ph.OperatedAt)
            .Skip((query.PageNumber - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync();

        var dtos = items.Select(ph => new ProcessingHistoryDto
        {
            Id = ph.Id,
            EntityType = ph.EntityType,
            EntityId = ph.EntityId,
            ActionType = ph.ActionType,
            Description = ph.Description,
            FromStatus = ph.FromStatus.HasValue ? (int)ph.FromStatus.Value : null,
            ToStatus = ph.ToStatus.HasValue ? (int)ph.ToStatus.Value : null,
            OperatorId = ph.OperatorId,
            OperatorName = ph.Operator?.FullName ?? string.Empty,
            OperatorRole = (int)ph.OperatorRole,
            OperatorRoleName = GetRoleName(ph.OperatorRole),
            OperatedAt = ph.OperatedAt,
            BatchId = ph.BatchId,
            SourceReference = ph.SourceReference
        });

        return OkResult(new PagedResult<ProcessingHistoryDto>
        {
            Items = dtos,
            TotalCount = totalCount,
            PageNumber = query.PageNumber,
            PageSize = query.PageSize
        });
    }

    private static string GetRoleName(AuditRole role) => role switch
    {
        AuditRole.Auditor => "审计员",
        AuditRole.BusinessOwner => "业务负责人",
        AuditRole.ComplianceOfficer => "合规官",
        AuditRole.Management => "管理层",
        _ => "未知角色"
    };
}
