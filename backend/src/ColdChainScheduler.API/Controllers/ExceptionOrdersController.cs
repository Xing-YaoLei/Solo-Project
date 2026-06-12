using ColdChainScheduler.Domain.Entities;
using ColdChainScheduler.Domain.Enums;
using ColdChainScheduler.Domain.Interfaces;
using ColdChainScheduler.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ColdChainScheduler.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ExceptionOrdersController : ControllerBase
{
    private readonly IRepository<ExceptionOrder> _repository;
    private readonly IStatusChangeLogService _logService;
    private readonly AppDbContext _context;

    public ExceptionOrdersController(
        IRepository<ExceptionOrder> repository,
        IStatusChangeLogService logService,
        AppDbContext context)
    {
        _repository = repository;
        _logService = logService;
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ExceptionOrder>>> GetAll(
        [FromQuery] ExceptionType? exceptionType,
        [FromQuery] ExceptionSeverity? severity,
        [FromQuery] ExceptionResolution? resolution)
    {
        var query = _context.ExceptionOrders.AsQueryable();

        if (exceptionType.HasValue)
            query = query.Where(e => e.ExceptionType == exceptionType.Value);

        if (severity.HasValue)
            query = query.Where(e => e.Severity == severity.Value);

        if (resolution.HasValue)
            query = query.Where(e => e.Resolution == resolution.Value);

        var orders = await query.OrderByDescending(e => e.CreatedAt).ToListAsync();
        return Ok(orders);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ExceptionOrder>> GetById(int id)
    {
        var order = await _repository.GetByIdAsync(id);
        if (order == null) return NotFound(new { message = $"异常工单 {id} 不存在" });
        return Ok(order);
    }

    [HttpPost]
    public async Task<ActionResult<ExceptionOrder>> Create(ExceptionOrder order)
    {
        order.CreatedAt = DateTime.UtcNow;
        order.Resolution = ExceptionResolution.Pending;
        await _repository.AddAsync(order);
        await _repository.SaveChangesAsync();

        await _logService.LogStatusChange("ExceptionOrder", order.Id, null, ExceptionResolution.Pending.ToString(), null, "创建异常工单");

        return CreatedAtAction(nameof(GetById), new { id = order.Id }, order);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(int id, ExceptionOrder updated)
    {
        var order = await _repository.GetByIdAsync(id);
        if (order == null) return NotFound(new { message = $"异常工单 {id} 不存在" });

        if (order.Resolution != ExceptionResolution.Pending)
            return BadRequest(new { message = "只有待处理的异常工单可以修改" });

        order.GroupBatchId = updated.GroupBatchId;
        order.ArrivalListId = updated.ArrivalListId;
        order.ProductTagId = updated.ProductTagId;
        order.CustomerName = updated.CustomerName;
        order.CustomerPhone = updated.CustomerPhone;
        order.ExceptionType = updated.ExceptionType;
        order.Severity = updated.Severity;
        order.ImpactDescription = updated.ImpactDescription;
        order.Responsibility = updated.Responsibility;

        await _repository.UpdateAsync(order);
        await _repository.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var order = await _repository.GetByIdAsync(id);
        if (order == null) return NotFound(new { message = $"异常工单 {id} 不存在" });

        await _repository.DeleteAsync(order);
        await _repository.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost("{id}/resolve")]
    public async Task<ActionResult> Resolve(int id, [FromBody] ResolveRequest request)
    {
        var order = await _repository.GetByIdAsync(id);
        if (order == null) return NotFound(new { message = $"异常工单 {id} 不存在" });

        if (order.Resolution != ExceptionResolution.Pending)
            return BadRequest(new { message = "只有待处理的异常工单可以处理" });

        var oldResolution = order.Resolution.ToString();
        order.Resolution = request.Resolution;
        order.ResolutionNotes = request.ResolutionNotes;
        order.ResolvedBy = request.ResolvedBy;
        order.ResolvedAt = DateTime.UtcNow;

        await _repository.UpdateAsync(order);
        await _repository.SaveChangesAsync();

        await _logService.LogStatusChange("ExceptionOrder", id, oldResolution, request.Resolution.ToString(), request.ResolvedBy, "处理异常工单");

        return NoContent();
    }
}

public class ResolveRequest
{
    public ExceptionResolution Resolution { get; set; }
    public string? ResolutionNotes { get; set; }
    public string? ResolvedBy { get; set; }
}
