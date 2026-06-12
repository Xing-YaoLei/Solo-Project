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
[Route("api/group-batches")]
public class GroupBatchesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IStatusChangeLogService _logService;

    public GroupBatchesController(AppDbContext context, IStatusChangeLogService logService)
    {
        _context = context;
        _logService = logService;
    }

    private static GroupBatchDto MapToDto(GroupBatch batch)
    {
        return new GroupBatchDto
        {
            Id = batch.Id,
            BatchNo = batch.BatchNo,
            BatchName = batch.BatchName,
            LeaderName = batch.LeaderName,
            LeaderPhone = batch.LeaderPhone,
            LeaderTierId = batch.LeaderTierId,
            LeaderTierName = batch.LeaderTier?.TierName ?? string.Empty,
            StartTime = batch.StartTime,
            EndTime = batch.EndTime,
            DeliveryTime = batch.DeliveryTime,
            Status = batch.BatchStatus,
            Notes = batch.Notes,
            CreatedAt = batch.CreatedAt,
            UpdatedAt = batch.UpdatedAt
        };
    }

    private static StatusChangeLogDto MapLogToDto(StatusChangeLog log)
    {
        return new StatusChangeLogDto
        {
            Id = log.Id,
            EntityId = log.EntityId,
            EntityType = log.EntityType,
            FromStatus = log.OldStatus,
            ToStatus = log.NewStatus,
            ChangedBy = log.ChangedBy,
            ChangedAt = log.ChangedAt,
            Remark = log.Reason
        };
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<GroupBatchDto>>>> GetAll()
    {
        var batches = await _context.GroupBatches
            .Include(b => b.LeaderTier)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();
        var dtos = batches.Select(MapToDto).ToList();
        return Ok(ApiResponse.Ok(dtos));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<GroupBatchDto>>> GetById(int id)
    {
        var batch = await _context.GroupBatches
            .Include(b => b.LeaderTier)
            .FirstOrDefaultAsync(b => b.Id == id);
        if (batch == null) return Ok(ApiResponse.Fail<GroupBatchDto>($"团购批次 {id} 不存在"));
        return Ok(ApiResponse.Ok(MapToDto(batch)));
    }

    [HttpGet("{id}/status-history")]
    public async Task<ActionResult<ApiResponse<List<StatusChangeLogDto>>>> GetStatusHistory(int id)
    {
        var batch = await _context.GroupBatches.FindAsync(id);
        if (batch == null) return Ok(ApiResponse.Fail<List<StatusChangeLogDto>>($"团购批次 {id} 不存在"));

        var logs = await _logService.GetEntityHistoryAsync("GroupBatch", id);
        var dtos = logs.Select(MapLogToDto).ToList();
        return Ok(ApiResponse.Ok(dtos));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<GroupBatchDto>>> Create(GroupBatch batch)
    {
        batch.CreatedAt = DateTime.UtcNow;
        batch.BatchStatus = BatchStatus.Draft;
        _context.GroupBatches.Add(batch);
        await _context.SaveChangesAsync();

        await _logService.LogStatusChange("GroupBatch", batch.Id, null, BatchStatus.Draft.ToString(), null, "创建团购批次");

        var created = await _context.GroupBatches
            .Include(b => b.LeaderTier)
            .FirstOrDefaultAsync(b => b.Id == batch.Id);
        return Ok(ApiResponse.Ok(MapToDto(created!), "创建成功"));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> Update(int id, GroupBatch updated)
    {
        var batch = await _context.GroupBatches.FindAsync(id);
        if (batch == null) return Ok(ApiResponse.Fail($"团购批次 {id} 不存在"));

        if (batch.BatchStatus != BatchStatus.Draft)
            return Ok(ApiResponse.Fail("只有草稿状态的批次可以修改"));

        batch.BatchNo = updated.BatchNo;
        batch.BatchName = updated.BatchName;
        batch.LeaderName = updated.LeaderName;
        batch.LeaderPhone = updated.LeaderPhone;
        batch.LeaderTierId = updated.LeaderTierId;
        batch.StartTime = updated.StartTime;
        batch.EndTime = updated.EndTime;
        batch.DeliveryTime = updated.DeliveryTime;
        batch.Notes = updated.Notes;

        await _context.SaveChangesAsync();

        return Ok(ApiResponse.Ok("更新成功"));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
    {
        var batch = await _context.GroupBatches.FindAsync(id);
        if (batch == null) return Ok(ApiResponse.Fail($"团购批次 {id} 不存在"));

        if (batch.BatchStatus != BatchStatus.Draft)
            return Ok(ApiResponse.Fail("只有草稿状态的批次可以删除"));

        var oldStatus = batch.BatchStatus.ToString();
        _context.GroupBatches.Remove(batch);
        await _context.SaveChangesAsync();

        await _logService.LogStatusChange("GroupBatch", id, oldStatus, "Deleted", null, "删除团购批次");

        return Ok(ApiResponse.Ok("删除成功"));
    }

    [HttpPost("{id}/open")]
    public async Task<ActionResult<ApiResponse<object>>> Open(int id)
    {
        var batch = await _context.GroupBatches.FindAsync(id);
        if (batch == null) return Ok(ApiResponse.Fail($"团购批次 {id} 不存在"));

        if (batch.BatchStatus != BatchStatus.Draft)
            return Ok(ApiResponse.Fail("只有草稿状态的批次可以开团"));

        var oldStatus = batch.BatchStatus.ToString();
        batch.BatchStatus = BatchStatus.Open;
        await _context.SaveChangesAsync();

        await _logService.LogStatusChange("GroupBatch", id, oldStatus, BatchStatus.Open.ToString(), null, "开团");

        return Ok(ApiResponse.Ok("开团成功"));
    }

    [HttpPost("{id}/close")]
    public async Task<ActionResult<ApiResponse<object>>> Close(int id)
    {
        var batch = await _context.GroupBatches.FindAsync(id);
        if (batch == null) return Ok(ApiResponse.Fail($"团购批次 {id} 不存在"));

        if (batch.BatchStatus != BatchStatus.Open)
            return Ok(ApiResponse.Fail("只有开团状态的批次可以截团"));

        var oldStatus = batch.BatchStatus.ToString();
        batch.BatchStatus = BatchStatus.Closed;
        await _context.SaveChangesAsync();

        await _logService.LogStatusChange("GroupBatch", id, oldStatus, BatchStatus.Closed.ToString(), null, "截团");

        return Ok(ApiResponse.Ok("截团成功"));
    }

    [HttpPost("{id}/deliver")]
    public async Task<ActionResult<ApiResponse<object>>> Deliver(int id)
    {
        var batch = await _context.GroupBatches.FindAsync(id);
        if (batch == null) return Ok(ApiResponse.Fail($"团购批次 {id} 不存在"));

        if (batch.BatchStatus != BatchStatus.Closed)
            return Ok(ApiResponse.Fail("只有截团状态的批次可以发货"));

        var oldStatus = batch.BatchStatus.ToString();
        batch.BatchStatus = BatchStatus.Delivering;
        batch.DeliveryTime = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        await _logService.LogStatusChange("GroupBatch", id, oldStatus, BatchStatus.Delivering.ToString(), null, "发货");

        return Ok(ApiResponse.Ok("发货成功"));
    }
}
