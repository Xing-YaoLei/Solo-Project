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
[Route("api/arrival-lists")]
public class ArrivalListsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IStatusChangeLogService _logService;

    public ArrivalListsController(AppDbContext context, IStatusChangeLogService logService)
    {
        _context = context;
        _logService = logService;
    }

    private static ArrivalListItemDto MapItemToDto(ArrivalListItem item)
    {
        return new ArrivalListItemDto
        {
            Id = item.Id,
            ArrivalListId = item.ArrivalListId,
            ProductTagId = item.ProductTagId,
            ProductTagName = item.ProductTag?.ProductName ?? string.Empty,
            ExpectedQuantity = item.ExpectedQty,
            ActualQuantity = item.ActualQty,
            Temperature = item.Temperature,
            Condition = item.Condition,
            Remark = item.Notes,
            PickupStatus = item.PickupStatus,
            PickupTime = item.PickupTime
        };
    }

    private static ArrivalListDto MapToDto(ArrivalList list)
    {
        return new ArrivalListDto
        {
            Id = list.Id,
            ListNo = list.ListNo,
            GroupBatchId = list.GroupBatchId,
            BatchNo = list.GroupBatch?.BatchNo ?? string.Empty,
            ArrivalTime = list.ArrivalTime,
            Receiver = list.Receiver,
            Status = list.ArrivalStatus,
            Notes = list.Notes,
            Items = list.Items.Select(MapItemToDto).ToList(),
            CreatedAt = list.CreatedAt,
            UpdatedAt = list.UpdatedAt
        };
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<ArrivalListDto>>>> GetAll()
    {
        var lists = await _context.ArrivalLists
            .Include(a => a.GroupBatch)
            .Include(a => a.Items).ThenInclude(i => i.ProductTag)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();
        var dtos = lists.Select(MapToDto).ToList();
        return Ok(ApiResponse.Ok(dtos));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<ArrivalListDto>>> GetById(int id)
    {
        var list = await _context.ArrivalLists
            .Include(a => a.GroupBatch)
            .Include(a => a.Items).ThenInclude(i => i.ProductTag)
            .FirstOrDefaultAsync(a => a.Id == id);
        if (list == null) return Ok(ApiResponse.Fail<ArrivalListDto>($"到货清单 {id} 不存在"));
        return Ok(ApiResponse.Ok(MapToDto(list)));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<ArrivalListDto>>> Create(ArrivalList list)
    {
        list.CreatedAt = DateTime.UtcNow;
        list.ArrivalStatus = ArrivalStatus.Pending;

        if (list.Items != null && list.Items.Any())
        {
            foreach (var item in list.Items)
            {
                item.PickupStatus = PickupStatus.PendingPickup;
            }
        }

        _context.ArrivalLists.Add(list);
        await _context.SaveChangesAsync();

        await _logService.LogStatusChange("ArrivalList", list.Id, null, ArrivalStatus.Pending.ToString(), null, "创建到货清单");

        var created = await _context.ArrivalLists
            .Include(a => a.GroupBatch)
            .Include(a => a.Items).ThenInclude(i => i.ProductTag)
            .FirstOrDefaultAsync(a => a.Id == list.Id);
        return Ok(ApiResponse.Ok(MapToDto(created!), "创建成功"));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> Update(int id, ArrivalList updated)
    {
        var list = await _context.ArrivalLists
            .Include(a => a.Items)
            .FirstOrDefaultAsync(a => a.Id == id);
        if (list == null) return Ok(ApiResponse.Fail($"到货清单 {id} 不存在"));

        if (list.ArrivalStatus == ArrivalStatus.Inspected)
            return Ok(ApiResponse.Fail("已验收的到货清单不能修改"));

        list.ListNo = updated.ListNo;
        list.GroupBatchId = updated.GroupBatchId;
        list.ArrivalTime = updated.ArrivalTime;
        list.Receiver = updated.Receiver;
        list.Notes = updated.Notes;

        if (updated.Items != null)
        {
            _context.ArrivalListItems.RemoveRange(list.Items);
            foreach (var item in updated.Items)
            {
                item.ArrivalListId = id;
                if (item.PickupStatus == null)
                    item.PickupStatus = PickupStatus.PendingPickup;
                _context.ArrivalListItems.Add(item);
            }
        }

        await _context.SaveChangesAsync();

        return Ok(ApiResponse.Ok("更新成功"));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
    {
        var list = await _context.ArrivalLists.FindAsync(id);
        if (list == null) return Ok(ApiResponse.Fail($"到货清单 {id} 不存在"));

        if (list.ArrivalStatus == ArrivalStatus.Inspected)
            return Ok(ApiResponse.Fail("已验收的到货清单不能删除"));

        var oldStatus = list.ArrivalStatus.ToString();
        _context.ArrivalLists.Remove(list);
        await _context.SaveChangesAsync();

        await _logService.LogStatusChange("ArrivalList", id, oldStatus, "Deleted", null, "删除到货清单");

        return Ok(ApiResponse.Ok("删除成功"));
    }

    [HttpPost("{id}/inspect")]
    public async Task<ActionResult<ApiResponse<object>>> Inspect(int id)
    {
        var list = await _context.ArrivalLists
            .Include(a => a.Items)
            .FirstOrDefaultAsync(a => a.Id == id);
        if (list == null) return Ok(ApiResponse.Fail($"到货清单 {id} 不存在"));

        if (list.ArrivalStatus != ArrivalStatus.Arrived && list.ArrivalStatus != ArrivalStatus.PartialArrival)
            return Ok(ApiResponse.Fail("只有已到货或部分到货的清单可以验收"));

        var oldStatus = list.ArrivalStatus.ToString();
        list.ArrivalStatus = ArrivalStatus.Inspected;

        if (list.Items != null && list.Items.Any())
        {
            foreach (var item in list.Items)
            {
                if (item.PickupStatus == null || item.PickupStatus == PickupStatus.PendingPickup)
                {
                    item.PickupStatus = PickupStatus.PendingPickup;
                }
            }
        }

        await _context.SaveChangesAsync();

        await _logService.LogStatusChange("ArrivalList", id, oldStatus, ArrivalStatus.Inspected.ToString(), null, "验收完成");

        return Ok(ApiResponse.Ok("验收成功"));
    }

    [HttpPost("{id}/pickup")]
    public async Task<ActionResult<ApiResponse<object>>> Pickup(int id, [FromBody] PickupRequest request)
    {
        var item = await _context.ArrivalListItems
            .Include(i => i.ArrivalList)
            .FirstOrDefaultAsync(i => i.Id == request.ItemId && i.ArrivalListId == id);
        if (item == null) return Ok(ApiResponse.Fail("到货明细不存在"));

        if (item.PickupStatus == PickupStatus.PickedUp)
            return Ok(ApiResponse.Fail("该商品已自提"));

        if (item.PickupStatus == PickupStatus.OverdueUncollected)
            return Ok(ApiResponse.Fail("该商品已超时未取，无法自提"));

        var oldStatus = item.PickupStatus;
        item.PickupStatus = PickupStatus.PickedUp;
        item.PickupTime = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        await _logService.LogStatusChange(
            "ArrivalListItem",
            item.Id,
            oldStatus?.ToString(),
            PickupStatus.PickedUp.ToString(),
            null,
            "用户已完成自提");

        return Ok(ApiResponse.Ok("自提成功"));
    }
}

public class PickupRequest
{
    public int ItemId { get; set; }
}
