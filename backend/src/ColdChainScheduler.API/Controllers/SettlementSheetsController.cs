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
[Route("api/settlement-sheets")]
public class SettlementSheetsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IStatusChangeLogService _logService;

    public SettlementSheetsController(
        AppDbContext context,
        IStatusChangeLogService logService)
    {
        _context = context;
        _logService = logService;
    }

    private static SettlementSheetItemDto MapItemToDto(SettlementSheetItem item)
    {
        return new SettlementSheetItemDto
        {
            Id = item.Id,
            SettlementSheetId = item.SettlementSheetId,
            ProductTagId = item.ProductTagId,
            ProductTagName = item.ProductTag?.ProductName ?? string.Empty,
            Quantity = item.Quantity,
            UnitPrice = item.UnitPrice,
            Subtotal = item.Subtotal,
            CaliberNote = item.CaliberNote
        };
    }

    private static SettlementSheetDto MapToDto(SettlementSheet sheet)
    {
        return new SettlementSheetDto
        {
            Id = sheet.Id,
            SheetNo = sheet.SheetNo,
            GroupBatchId = sheet.GroupBatchId,
            BatchNo = sheet.GroupBatch?.BatchNo ?? string.Empty,
            LeaderTierId = sheet.LeaderTierId,
            LeaderTierName = sheet.LeaderTier?.TierName ?? string.Empty,
            TotalAmount = sheet.TotalAmount,
            ItemCount = sheet.ItemCount,
            Status = sheet.SettlementStatus,
            CaliberDescription = sheet.CaliberNote,
            Items = sheet.Items.Select(MapItemToDto).ToList(),
            SettledAt = sheet.SettledAt,
            CreatedAt = sheet.CreatedAt,
            UpdatedAt = sheet.UpdatedAt
        };
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<SettlementSheetDto>>>> GetAll()
    {
        var sheets = await _context.SettlementSheets
            .Include(s => s.GroupBatch)
            .Include(s => s.LeaderTier)
            .Include(s => s.Items).ThenInclude(i => i.ProductTag)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();
        var dtos = sheets.Select(MapToDto).ToList();
        return Ok(ApiResponse.Ok(dtos));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<SettlementSheetDto>>> GetById(int id)
    {
        var sheet = await _context.SettlementSheets
            .Include(s => s.GroupBatch)
            .Include(s => s.LeaderTier)
            .Include(s => s.Items).ThenInclude(i => i.ProductTag)
            .FirstOrDefaultAsync(s => s.Id == id);
        if (sheet == null) return Ok(ApiResponse.Fail<SettlementSheetDto>($"结算单 {id} 不存在"));
        return Ok(ApiResponse.Ok(MapToDto(sheet)));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<SettlementSheetDto>>> Create(SettlementSheet sheet)
    {
        sheet.CreatedAt = DateTime.UtcNow;
        sheet.SettlementStatus = SettlementStatus.Pending;
        sheet.CaliberNote = "金额=数量×单价, 客单价=总金额/品项数";

        if (sheet.Items != null && sheet.Items.Any())
        {
            foreach (var item in sheet.Items)
            {
                item.Subtotal = item.Quantity * item.UnitPrice;
            }
            sheet.TotalAmount = sheet.Items.Sum(i => i.Subtotal);
            sheet.ItemCount = sheet.Items.Count;
        }

        _context.SettlementSheets.Add(sheet);
        await _context.SaveChangesAsync();

        await _logService.LogStatusChange("SettlementSheet", sheet.Id, null, SettlementStatus.Pending.ToString(), null, "创建结算单");

        var created = await _context.SettlementSheets
            .Include(s => s.GroupBatch)
            .Include(s => s.LeaderTier)
            .Include(s => s.Items).ThenInclude(i => i.ProductTag)
            .FirstOrDefaultAsync(s => s.Id == sheet.Id);
        return Ok(ApiResponse.Ok(MapToDto(created!), "创建成功"));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> Update(int id, SettlementSheet updated)
    {
        var sheet = await _context.SettlementSheets.FindAsync(id);
        if (sheet == null) return Ok(ApiResponse.Fail($"结算单 {id} 不存在"));

        if (sheet.SettlementStatus != SettlementStatus.Pending)
            return Ok(ApiResponse.Fail("只有待确认状态的结算单可以修改"));

        sheet.GroupBatchId = updated.GroupBatchId;
        sheet.LeaderTierId = updated.LeaderTierId;
        sheet.CaliberNote = updated.CaliberNote;

        await _context.SaveChangesAsync();

        return Ok(ApiResponse.Ok("更新成功"));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
    {
        var sheet = await _context.SettlementSheets.FindAsync(id);
        if (sheet == null) return Ok(ApiResponse.Fail($"结算单 {id} 不存在"));

        if (sheet.SettlementStatus != SettlementStatus.Pending)
            return Ok(ApiResponse.Fail("只有待确认状态的结算单可以删除"));

        var oldStatus = sheet.SettlementStatus.ToString();
        _context.SettlementSheets.Remove(sheet);
        await _context.SaveChangesAsync();

        await _logService.LogStatusChange("SettlementSheet", id, oldStatus, "Deleted", null, "删除结算单");

        return Ok(ApiResponse.Ok("删除成功"));
    }

    [HttpPost("{id}/confirm")]
    public async Task<ActionResult<ApiResponse<object>>> Confirm(int id)
    {
        var sheet = await _context.SettlementSheets.FindAsync(id);
        if (sheet == null) return Ok(ApiResponse.Fail($"结算单 {id} 不存在"));

        if (sheet.SettlementStatus != SettlementStatus.Pending && sheet.SettlementStatus != SettlementStatus.Calculating)
            return Ok(ApiResponse.Fail("当前状态不允许确认"));

        var oldStatus = sheet.SettlementStatus.ToString();
        sheet.SettlementStatus = SettlementStatus.Confirmed;
        await _context.SaveChangesAsync();

        await _logService.LogStatusChange("SettlementSheet", id, oldStatus, SettlementStatus.Confirmed.ToString(), null, "确认结算单");

        return Ok(ApiResponse.Ok("确认成功"));
    }

    [HttpPost("{id}/settle")]
    public async Task<ActionResult<ApiResponse<object>>> Settle(int id)
    {
        var sheet = await _context.SettlementSheets.FindAsync(id);
        if (sheet == null) return Ok(ApiResponse.Fail($"结算单 {id} 不存在"));

        if (sheet.SettlementStatus != SettlementStatus.Confirmed)
            return Ok(ApiResponse.Fail("只有已确认的结算单可以结算"));

        var oldStatus = sheet.SettlementStatus.ToString();
        sheet.SettlementStatus = SettlementStatus.Settled;
        sheet.SettledAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        await _logService.LogStatusChange("SettlementSheet", id, oldStatus, SettlementStatus.Settled.ToString(), null, "结算完成");

        return Ok(ApiResponse.Ok("结算成功"));
    }
}
