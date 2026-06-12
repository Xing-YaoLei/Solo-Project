using ColdChainScheduler.API.Dtos;
using ColdChainScheduler.Domain.Common;
using ColdChainScheduler.Domain.Entities;
using ColdChainScheduler.Domain.Enums;
using ColdChainScheduler.Domain.Interfaces;
using ColdChainScheduler.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ColdChainScheduler.API.Controllers;

[ApiController]
[Route("api/exception-orders")]
public class ExceptionOrdersController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IStatusChangeLogService _logService;

    public ExceptionOrdersController(
        AppDbContext context,
        IStatusChangeLogService logService)
    {
        _context = context;
        _logService = logService;
    }

    private static ExceptionOrderDto MapToDto(ExceptionOrder order, List<StatusChangeLogDto>? history = null)
    {
        return new ExceptionOrderDto
        {
            Id = order.Id,
            ExceptionNo = order.OrderNo,
            GroupBatchId = order.GroupBatchId,
            BatchNo = order.GroupBatch?.BatchNo ?? string.Empty,
            ArrivalListId = order.ArrivalListId,
            ProductTagId = order.ProductTagId,
            ProductTagName = order.ProductTag?.ProductName,
            CustomerName = order.CustomerName,
            CustomerPhone = order.CustomerPhone,
            ExceptionType = order.ExceptionType,
            Severity = order.Severity,
            ImpactDescription = order.ImpactDescription,
            Responsibility = order.Responsibility,
            Resolution = order.Resolution,
            ResolutionNotes = order.ResolutionNotes,
            ResolvedBy = order.ResolvedBy,
            ResolvedAt = order.ResolvedAt,
            CreatedAt = order.CreatedAt,
            UpdatedAt = order.UpdatedAt,
            StatusHistory = history ?? new List<StatusChangeLogDto>()
        };
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<ExceptionOrderDto>>>> GetAll(
        [FromQuery] ExceptionType? exceptionType,
        [FromQuery] ExceptionSeverity? severity,
        [FromQuery] ExceptionResolution? resolution)
    {
        var query = _context.ExceptionOrders
            .Include(e => e.GroupBatch)
            .Include(e => e.ProductTag)
            .AsQueryable();

        if (exceptionType.HasValue)
            query = query.Where(e => e.ExceptionType == exceptionType.Value);

        if (severity.HasValue)
            query = query.Where(e => e.Severity == severity.Value);

        if (resolution.HasValue)
            query = query.Where(e => e.Resolution == resolution.Value);

        var orders = await query.OrderByDescending(e => e.CreatedAt).ToListAsync();
        var dtos = orders.Select(o => MapToDto(o)).ToList();
        return Ok(ApiResponse.Ok(dtos));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<ExceptionOrderDto>>> GetById(int id)
    {
        var order = await _context.ExceptionOrders
            .Include(e => e.GroupBatch)
            .Include(e => e.ProductTag)
            .FirstOrDefaultAsync(e => e.Id == id);
        if (order == null) return Ok(ApiResponse.Fail<ExceptionOrderDto>($"异常工单 {id} 不存在"));

        var statusHistory = await _logService.GetEntityHistoryAsync("ExceptionOrder", id);
        var arrivalHistory = order.ArrivalListId.HasValue
            ? await _logService.GetEntityHistoryAsync("ArrivalListItem", order.ArrivalListId.Value)
            : Enumerable.Empty<StatusChangeLog>();

        var historyDtos = new List<StatusChangeLogDto>();
        foreach (var log in statusHistory)
        {
            historyDtos.Add(new StatusChangeLogDto
            {
                Id = log.Id,
                EntityId = log.EntityId,
                EntityType = log.EntityType,
                FromStatus = log.OldStatus,
                ToStatus = log.NewStatus,
                ChangedBy = log.ChangedBy,
                ChangedAt = log.ChangedAt,
                Remark = log.Reason
            });
        }
        foreach (var log in arrivalHistory)
        {
            historyDtos.Add(new StatusChangeLogDto
            {
                Id = log.Id,
                EntityId = log.EntityId,
                EntityType = "自提状态",
                FromStatus = log.OldStatus,
                ToStatus = log.NewStatus,
                ChangedBy = log.ChangedBy,
                ChangedAt = log.ChangedAt,
                Remark = log.Reason
            });
        }

        historyDtos = historyDtos.OrderByDescending(h => h.ChangedAt).ToList();

        return Ok(ApiResponse.Ok(MapToDto(order, historyDtos)));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<ExceptionOrderDto>>> Create(ExceptionOrder order)
    {
        order.CreatedAt = DateTime.UtcNow;
        order.Resolution = ExceptionResolution.Pending;
        _context.ExceptionOrders.Add(order);
        await _context.SaveChangesAsync();

        await _logService.LogStatusChange("ExceptionOrder", order.Id, null, ExceptionResolution.Pending.ToString(), null, "创建异常工单");

        var created = await _context.ExceptionOrders
            .Include(e => e.GroupBatch)
            .Include(e => e.ProductTag)
            .FirstOrDefaultAsync(e => e.Id == order.Id);
        return Ok(ApiResponse.Ok(MapToDto(created!), "创建成功"));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> Update(int id, ExceptionOrder updated)
    {
        var order = await _context.ExceptionOrders.FindAsync(id);
        if (order == null) return Ok(ApiResponse.Fail($"异常工单 {id} 不存在"));

        if (order.Resolution != ExceptionResolution.Pending)
            return Ok(ApiResponse.Fail("只有待处理的异常工单可以修改"));

        order.GroupBatchId = updated.GroupBatchId;
        order.ArrivalListId = updated.ArrivalListId;
        order.ProductTagId = updated.ProductTagId;
        order.CustomerName = updated.CustomerName;
        order.CustomerPhone = updated.CustomerPhone;
        order.ExceptionType = updated.ExceptionType;
        order.Severity = updated.Severity;
        order.ImpactDescription = updated.ImpactDescription;
        order.Responsibility = updated.Responsibility;

        await _context.SaveChangesAsync();

        return Ok(ApiResponse.Ok("更新成功"));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
    {
        var order = await _context.ExceptionOrders.FindAsync(id);
        if (order == null) return Ok(ApiResponse.Fail($"异常工单 {id} 不存在"));

        _context.ExceptionOrders.Remove(order);
        await _context.SaveChangesAsync();

        return Ok(ApiResponse.Ok("删除成功"));
    }

    [HttpPost("{id}/resolve")]
    public async Task<ActionResult<ApiResponse<object>>> Resolve(int id, [FromBody] ResolveExceptionRequest request)
    {
        var order = await _context.ExceptionOrders.FindAsync(id);
        if (order == null) return Ok(ApiResponse.Fail($"异常工单 {id} 不存在"));

        if (order.Resolution != ExceptionResolution.Pending)
            return Ok(ApiResponse.Fail("只有待处理的异常工单可以处理"));

        var oldResolution = order.Resolution.ToString();
        order.Resolution = request.Resolution;
        order.ResolutionNotes = request.ResolutionNotes;
        order.ResolvedBy = request.ResolvedBy;
        order.ResolvedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _logService.LogStatusChange("ExceptionOrder", id, oldResolution, request.Resolution.ToString(), request.ResolvedBy, "处理异常工单");

        return Ok(ApiResponse.Ok("处理成功"));
    }
}

public class ResolveExceptionRequest
{
    public ExceptionResolution Resolution { get; set; }
    public string? ResolutionNotes { get; set; }
    public string? ResolvedBy { get; set; }
}
