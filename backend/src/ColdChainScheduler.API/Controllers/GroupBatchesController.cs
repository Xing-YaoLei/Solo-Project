using ColdChainScheduler.Domain.Entities;
using ColdChainScheduler.Domain.Enums;
using ColdChainScheduler.Domain.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ColdChainScheduler.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GroupBatchesController : ControllerBase
{
    private readonly IRepository<GroupBatch> _repository;
    private readonly IStatusChangeLogService _logService;

    public GroupBatchesController(IRepository<GroupBatch> repository, IStatusChangeLogService logService)
    {
        _repository = repository;
        _logService = logService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<GroupBatch>>> GetAll()
    {
        var batches = await _repository.GetAllAsync();
        return Ok(batches);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<GroupBatch>> GetById(int id)
    {
        var batch = await _repository.GetByIdAsync(id);
        if (batch == null) return NotFound(new { message = $"团购批次 {id} 不存在" });
        return Ok(batch);
    }

    [HttpPost]
    public async Task<ActionResult<GroupBatch>> Create(GroupBatch batch)
    {
        batch.CreatedAt = DateTime.UtcNow;
        batch.BatchStatus = BatchStatus.Draft;
        await _repository.AddAsync(batch);
        await _repository.SaveChangesAsync();

        await _logService.LogStatusChange("GroupBatch", batch.Id, null, BatchStatus.Draft.ToString(), null, "创建团购批次");

        return CreatedAtAction(nameof(GetById), new { id = batch.Id }, batch);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(int id, GroupBatch updated)
    {
        var batch = await _repository.GetByIdAsync(id);
        if (batch == null) return NotFound(new { message = $"团购批次 {id} 不存在" });

        if (batch.BatchStatus != BatchStatus.Draft)
            return BadRequest(new { message = "只有草稿状态的批次可以修改" });

        batch.BatchNo = updated.BatchNo;
        batch.BatchName = updated.BatchName;
        batch.LeaderName = updated.LeaderName;
        batch.LeaderPhone = updated.LeaderPhone;
        batch.LeaderTierId = updated.LeaderTierId;
        batch.StartTime = updated.StartTime;
        batch.EndTime = updated.EndTime;
        batch.DeliveryTime = updated.DeliveryTime;
        batch.Notes = updated.Notes;

        await _repository.UpdateAsync(batch);
        await _repository.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var batch = await _repository.GetByIdAsync(id);
        if (batch == null) return NotFound(new { message = $"团购批次 {id} 不存在" });

        if (batch.BatchStatus != BatchStatus.Draft)
            return BadRequest(new { message = "只有草稿状态的批次可以删除" });

        var oldStatus = batch.BatchStatus.ToString();
        await _repository.DeleteAsync(batch);
        await _repository.SaveChangesAsync();

        await _logService.LogStatusChange("GroupBatch", id, oldStatus, "Deleted", null, "删除团购批次");

        return NoContent();
    }

    [HttpPost("{id}/open")]
    public async Task<ActionResult> Open(int id)
    {
        var batch = await _repository.GetByIdAsync(id);
        if (batch == null) return NotFound(new { message = $"团购批次 {id} 不存在" });

        if (batch.BatchStatus != BatchStatus.Draft)
            return BadRequest(new { message = "只有草稿状态的批次可以开团" });

        var oldStatus = batch.BatchStatus.ToString();
        batch.BatchStatus = BatchStatus.Open;
        await _repository.UpdateAsync(batch);
        await _repository.SaveChangesAsync();

        await _logService.LogStatusChange("GroupBatch", id, oldStatus, BatchStatus.Open.ToString(), null, "开团");

        return NoContent();
    }

    [HttpPost("{id}/close")]
    public async Task<ActionResult> Close(int id)
    {
        var batch = await _repository.GetByIdAsync(id);
        if (batch == null) return NotFound(new { message = $"团购批次 {id} 不存在" });

        if (batch.BatchStatus != BatchStatus.Open)
            return BadRequest(new { message = "只有开团状态的批次可以截团" });

        var oldStatus = batch.BatchStatus.ToString();
        batch.BatchStatus = BatchStatus.Closed;
        await _repository.UpdateAsync(batch);
        await _repository.SaveChangesAsync();

        await _logService.LogStatusChange("GroupBatch", id, oldStatus, BatchStatus.Closed.ToString(), null, "截团");

        return NoContent();
    }

    [HttpPost("{id}/deliver")]
    public async Task<ActionResult> Deliver(int id)
    {
        var batch = await _repository.GetByIdAsync(id);
        if (batch == null) return NotFound(new { message = $"团购批次 {id} 不存在" });

        if (batch.BatchStatus != BatchStatus.Closed)
            return BadRequest(new { message = "只有截团状态的批次可以发货" });

        var oldStatus = batch.BatchStatus.ToString();
        batch.BatchStatus = BatchStatus.Delivering;
        batch.DeliveryTime = DateTime.UtcNow;
        await _repository.UpdateAsync(batch);
        await _repository.SaveChangesAsync();

        await _logService.LogStatusChange("GroupBatch", id, oldStatus, BatchStatus.Delivering.ToString(), null, "发货");

        return NoContent();
    }
}
