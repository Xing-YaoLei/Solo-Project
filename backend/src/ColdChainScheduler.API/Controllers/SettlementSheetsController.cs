using ColdChainScheduler.Domain.Entities;
using ColdChainScheduler.Domain.Enums;
using ColdChainScheduler.Domain.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ColdChainScheduler.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SettlementSheetsController : ControllerBase
{
    private readonly IRepository<SettlementSheet> _repository;
    private readonly IRepository<SettlementSheetItem> _itemRepository;
    private readonly IStatusChangeLogService _logService;
    private readonly IExportService _exportService;

    public SettlementSheetsController(
        IRepository<SettlementSheet> repository,
        IRepository<SettlementSheetItem> itemRepository,
        IStatusChangeLogService logService,
        IExportService exportService)
    {
        _repository = repository;
        _itemRepository = itemRepository;
        _logService = logService;
        _exportService = exportService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SettlementSheet>>> GetAll()
    {
        var sheets = await _repository.GetAllAsync();
        return Ok(sheets);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SettlementSheet>> GetById(int id)
    {
        var sheet = await _repository.GetByIdAsync(id);
        if (sheet == null) return NotFound(new { message = $"结算单 {id} 不存在" });
        return Ok(sheet);
    }

    [HttpPost]
    public async Task<ActionResult<SettlementSheet>> Create(SettlementSheet sheet)
    {
        sheet.CreatedAt = DateTime.UtcNow;
        sheet.SettlementStatus = SettlementStatus.Pending;
        sheet.CaliberNote = "金额=数量×单价, 客单价=总金额/品项数";

        foreach (var item in sheet.Items)
        {
            item.Subtotal = item.Quantity * item.UnitPrice;
        }

        sheet.TotalAmount = sheet.Items.Sum(i => i.Subtotal);
        sheet.ItemCount = sheet.Items.Count;

        await _repository.AddAsync(sheet);
        await _repository.SaveChangesAsync();

        await _logService.LogStatusChange("SettlementSheet", sheet.Id, null, SettlementStatus.Pending.ToString(), null, "创建结算单");

        return CreatedAtAction(nameof(GetById), new { id = sheet.Id }, sheet);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(int id, SettlementSheet updated)
    {
        var sheet = await _repository.GetByIdAsync(id);
        if (sheet == null) return NotFound(new { message = $"结算单 {id} 不存在" });

        if (sheet.SettlementStatus != SettlementStatus.Pending)
            return BadRequest(new { message = "只有待确认状态的结算单可以修改" });

        sheet.GroupBatchId = updated.GroupBatchId;
        sheet.LeaderTierId = updated.LeaderTierId;
        sheet.CaliberNote = updated.CaliberNote;

        await _repository.UpdateAsync(sheet);
        await _repository.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var sheet = await _repository.GetByIdAsync(id);
        if (sheet == null) return NotFound(new { message = $"结算单 {id} 不存在" });

        if (sheet.SettlementStatus != SettlementStatus.Pending)
            return BadRequest(new { message = "只有待确认状态的结算单可以删除" });

        var oldStatus = sheet.SettlementStatus.ToString();
        await _repository.DeleteAsync(sheet);
        await _repository.SaveChangesAsync();

        await _logService.LogStatusChange("SettlementSheet", id, oldStatus, "Deleted", null, "删除结算单");

        return NoContent();
    }

    [HttpPost("{id}/confirm")]
    public async Task<ActionResult> Confirm(int id)
    {
        var sheet = await _repository.GetByIdAsync(id);
        if (sheet == null) return NotFound(new { message = $"结算单 {id} 不存在" });

        if (sheet.SettlementStatus != SettlementStatus.Pending && sheet.SettlementStatus != SettlementStatus.Calculating)
            return BadRequest(new { message = "当前状态不允许确认" });

        var oldStatus = sheet.SettlementStatus.ToString();
        sheet.SettlementStatus = SettlementStatus.Confirmed;
        await _repository.UpdateAsync(sheet);
        await _repository.SaveChangesAsync();

        await _logService.LogStatusChange("SettlementSheet", id, oldStatus, SettlementStatus.Confirmed.ToString(), null, "确认结算单");

        return NoContent();
    }

    [HttpPost("{id}/settle")]
    public async Task<ActionResult> Settle(int id)
    {
        var sheet = await _repository.GetByIdAsync(id);
        if (sheet == null) return NotFound(new { message = $"结算单 {id} 不存在" });

        if (sheet.SettlementStatus != SettlementStatus.Confirmed)
            return BadRequest(new { message = "只有已确认的结算单可以结算" });

        var oldStatus = sheet.SettlementStatus.ToString();
        sheet.SettlementStatus = SettlementStatus.Settled;
        sheet.SettledAt = DateTime.UtcNow;
        await _repository.UpdateAsync(sheet);
        await _repository.SaveChangesAsync();

        await _logService.LogStatusChange("SettlementSheet", id, oldStatus, SettlementStatus.Settled.ToString(), null, "结算完成");

        return NoContent();
    }
}
