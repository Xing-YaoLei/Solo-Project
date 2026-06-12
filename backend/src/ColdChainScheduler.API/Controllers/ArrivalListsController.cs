using ColdChainScheduler.Domain.Entities;
using ColdChainScheduler.Domain.Enums;
using ColdChainScheduler.Domain.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ColdChainScheduler.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ArrivalListsController : ControllerBase
{
    private readonly IRepository<ArrivalList> _repository;
    private readonly IStatusChangeLogService _logService;

    public ArrivalListsController(IRepository<ArrivalList> repository, IStatusChangeLogService logService)
    {
        _repository = repository;
        _logService = logService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ArrivalList>>> GetAll()
    {
        var lists = await _repository.GetAllAsync();
        return Ok(lists);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ArrivalList>> GetById(int id)
    {
        var list = await _repository.GetByIdAsync(id);
        if (list == null) return NotFound(new { message = $"到货清单 {id} 不存在" });
        return Ok(list);
    }

    [HttpPost]
    public async Task<ActionResult<ArrivalList>> Create(ArrivalList list)
    {
        list.CreatedAt = DateTime.UtcNow;
        list.ArrivalStatus = ArrivalStatus.Pending;
        await _repository.AddAsync(list);
        await _repository.SaveChangesAsync();

        await _logService.LogStatusChange("ArrivalList", list.Id, null, ArrivalStatus.Pending.ToString(), null, "创建到货清单");

        return CreatedAtAction(nameof(GetById), new { id = list.Id }, list);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(int id, ArrivalList updated)
    {
        var list = await _repository.GetByIdAsync(id);
        if (list == null) return NotFound(new { message = $"到货清单 {id} 不存在" });

        if (list.ArrivalStatus == ArrivalStatus.Inspected)
            return BadRequest(new { message = "已验收的到货清单不能修改" });

        list.ListNo = updated.ListNo;
        list.GroupBatchId = updated.GroupBatchId;
        list.ArrivalTime = updated.ArrivalTime;
        list.Receiver = updated.Receiver;
        list.Notes = updated.Notes;

        if (updated.Items != null)
        {
            list.Items = updated.Items;
        }

        await _repository.UpdateAsync(list);
        await _repository.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var list = await _repository.GetByIdAsync(id);
        if (list == null) return NotFound(new { message = $"到货清单 {id} 不存在" });

        if (list.ArrivalStatus == ArrivalStatus.Inspected)
            return BadRequest(new { message = "已验收的到货清单不能删除" });

        var oldStatus = list.ArrivalStatus.ToString();
        await _repository.DeleteAsync(list);
        await _repository.SaveChangesAsync();

        await _logService.LogStatusChange("ArrivalList", id, oldStatus, "Deleted", null, "删除到货清单");

        return NoContent();
    }

    [HttpPost("{id}/inspect")]
    public async Task<ActionResult> Inspect(int id)
    {
        var list = await _repository.GetByIdAsync(id);
        if (list == null) return NotFound(new { message = $"到货清单 {id} 不存在" });

        if (list.ArrivalStatus != ArrivalStatus.Arrived && list.ArrivalStatus != ArrivalStatus.PartialArrival)
            return BadRequest(new { message = "只有已到货或部分到货的清单可以验收" });

        var oldStatus = list.ArrivalStatus.ToString();
        list.ArrivalStatus = ArrivalStatus.Inspected;
        await _repository.UpdateAsync(list);
        await _repository.SaveChangesAsync();

        await _logService.LogStatusChange("ArrivalList", id, oldStatus, ArrivalStatus.Inspected.ToString(), null, "验收完成");

        return NoContent();
    }
}
