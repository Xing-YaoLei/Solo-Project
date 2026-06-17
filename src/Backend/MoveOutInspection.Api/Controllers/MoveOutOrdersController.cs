
using System.Linq.Expressions;
using CsvHelper;
using CsvHelper.Configuration;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoveOutInspection.Core.DTOs.Common;
using MoveOutInspection.Core.DTOs.MoveOutOrder;
using MoveOutInspection.Core.Entities;
using MoveOutInspection.Core.Enums;
using MoveOutInspection.Core.Interfaces;
using MoveOutInspection.Infrastructure.Services;

namespace MoveOutInspection.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MoveOutOrdersController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITimelineService _timelineService;

    public MoveOutOrdersController(IUnitOfWork unitOfWork, ITimelineService timelineService)
    {
        _unitOfWork = unitOfWork;
        _timelineService = timelineService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<MoveOutOrderListDto>>> GetOrders(
        [FromQuery] MoveOutOrderQueryDto query)
    {
        var paged = await QueryOrdersInternalAsync(query);
        return Ok(paged);
    }

    private async Task<PagedResult<MoveOutOrderListDto>> QueryOrdersInternalAsync(
        MoveOutOrderQueryDto query)
    {
        IQueryable<MoveOutOrder> queryable = _unitOfWork.MoveOutOrders.GetQueryable();

        if (query.Status.HasValue)
            queryable = queryable.Where(o => o.Status == query.Status.Value);
        if (query.AssignedHandlerId.HasValue)
            queryable = queryable.Where(o => o.AssignedHandlerId == query.AssignedHandlerId.Value);
        if (query.MoveOutDateFrom.HasValue)
            queryable = queryable.Where(o => o.MoveOutDate >= query.MoveOutDateFrom.Value);
        if (query.MoveOutDateTo.HasValue)
            queryable = queryable.Where(o => o.MoveOutDate <= query.MoveOutDateTo.Value);
        if (!string.IsNullOrWhiteSpace(query.Building))
            queryable = queryable.Where(o => o.Apartment != null && o.Apartment.Building.Contains(query.Building));
        if (!string.IsNullOrWhiteSpace(query.SearchKeyword))
            queryable = queryable.Where(o =>
                o.OrderNumber.Contains(query.SearchKeyword) ||
                (o.Tenant != null && o.Tenant.Name.Contains(query.SearchKeyword)) ||
                (o.Apartment != null && o.Apartment.ApartmentNumber.Contains(query.SearchKeyword)));

        if (query.HasOverdueRent.HasValue)
        {
            var overdueOrderIds = await _unitOfWork.RentOverdueRecords
                .FindAsync(r => !r.IsResolved);
            var ids = overdueOrderIds.Select(r => r.MoveOutOrderId).Distinct().ToList();
            if (query.HasOverdueRent.Value)
                queryable = queryable.Where(o => ids.Contains(o.Id));
            else
                queryable = queryable.Where(o => !ids.Contains(o.Id));
        }

        var totalCount = await queryable.CountAsync();
        var items = await queryable
            .OrderByDescending(o => o.CreatedAt)
            .Skip((query.PageNumber - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync();

        var dtos = new List<MoveOutOrderListDto>();
        foreach (var order in items)
        {
            var apartment = await _unitOfWork.Apartments.GetByIdAsync(order.ApartmentId);
            var tenant = await _unitOfWork.Tenants.GetByIdAsync(order.TenantId);
            var handler = order.AssignedHandlerId.HasValue
                ? await _unitOfWork.Staffs.GetByIdAsync(order.AssignedHandlerId.Value)
                : null;
            var hasOverdue = await _unitOfWork.RentOverdueRecords.ExistsAsync(
                r => r.MoveOutOrderId == order.Id && !r.IsResolved);
            var pendingTodos = await _unitOfWork.TodoTasks.CountAsync(
                t => t.MoveOutOrderId == order.Id &&
                     (t.Status == TodoStatus.Pending || t.Status == TodoStatus.InProgress));

            dtos.Add(new MoveOutOrderListDto
            {
                Id = order.Id,
                OrderNumber = order.OrderNumber,
                ApartmentNumber = apartment?.ApartmentNumber ?? string.Empty,
                Building = apartment?.Building ?? string.Empty,
                TenantName = tenant?.Name ?? string.Empty,
                TenantPhone = tenant?.Phone ?? string.Empty,
                MoveOutDate = order.MoveOutDate,
                ActualMoveOutDate = order.ActualMoveOutDate,
                Status = order.Status,
                AssignedHandlerName = handler?.Name,
                CreatedAt = order.CreatedAt,
                TotalDeduction = order.TotalDeduction,
                FinalRefund = order.FinalRefund,
                HasOverdueRent = hasOverdue,
                PendingTodos = pendingTodos
            });
        }

        return new PagedResult<MoveOutOrderListDto>
        {
            Items = dtos,
            TotalCount = totalCount,
            PageNumber = query.PageNumber,
            PageSize = query.PageSize
        };
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<MoveOutOrderDetailDto>> GetOrder(Guid id)
    {
        var order = await _unitOfWork.MoveOutOrders.GetByIdAsync(id);
        if (order == null) return NotFound();

        var apartment = await _unitOfWork.Apartments.GetByIdAsync(order.ApartmentId);
        var tenant = await _unitOfWork.Tenants.GetByIdAsync(order.TenantId);
        var handler = order.AssignedHandlerId.HasValue
            ? await _unitOfWork.Staffs.GetByIdAsync(order.AssignedHandlerId.Value)
            : null;
        var coHandler = order.CoHandlerId.HasValue
            ? await _unitOfWork.Staffs.GetByIdAsync(order.CoHandlerId.Value)
            : null;
        var sourceRecords = await _unitOfWork.SourceRecords.FindAsync(s => s.MoveOutOrderId == id);

        var dto = new MoveOutOrderDetailDto
        {
            Id = order.Id,
            OrderNumber = order.OrderNumber,
            ApartmentId = order.ApartmentId,
            ApartmentNumber = apartment?.ApartmentNumber ?? string.Empty,
            Building = apartment?.Building ?? string.Empty,
            Floor = apartment?.Floor ?? string.Empty,
            Address = apartment?.Address ?? string.Empty,
            TenantId = order.TenantId,
            TenantName = tenant?.Name ?? string.Empty,
            TenantPhone = tenant?.Phone ?? string.Empty,
            TenantEmail = tenant?.Email,
            LeaseStartDate = tenant?.LeaseStartDate,
            LeaseEndDate = tenant?.LeaseEndDate,
            MonthlyRent = tenant?.MonthlyRent ?? 0,
            Deposit = tenant?.Deposit ?? 0,
            MoveOutDate = order.MoveOutDate,
            ActualMoveOutDate = order.ActualMoveOutDate,
            InspectionDate = order.InspectionDate,
            Status = order.Status,
            AssignedHandlerId = order.AssignedHandlerId,
            AssignedHandlerName = handler?.Name,
            AssignedHandlerPhone = handler?.Phone,
            CoHandlerId = order.CoHandlerId,
            CoHandlerName = coHandler?.Name,
            Reason = order.Reason,
            TotalDeduction = order.TotalDeduction,
            FinalRefund = order.FinalRefund,
            ReviewResult = order.ReviewResult,
            CompletedAt = order.CompletedAt,
            CreatedAt = order.CreatedAt,
            CreatedBy = order.CreatedBy,
            SourceRecords = sourceRecords.Select(s => new SourceRecordDto
            {
                Id = s.Id,
                SourceType = s.SourceType,
                SourceId = s.SourceId,
                SourceName = s.SourceName,
                OriginalData = s.OriginalData,
                Remarks = s.Remarks,
                CreatedAt = s.CreatedAt
            }).ToList()
        };

        return Ok(dto);
    }

    [HttpPost]
    public async Task<ActionResult<MoveOutOrderDetailDto>> CreateOrder([FromBody] CreateMoveOutOrderDto dto)
    {
        var orderNo = $"MO{DateTime.Now:yyyyMM}{(await _unitOfWork.MoveOutOrders.CountAsync() + 1):D3}";
        var order = new MoveOutOrder
        {
            Id = Guid.NewGuid(),
            OrderNumber = orderNo,
            ApartmentId = dto.ApartmentId,
            TenantId = dto.TenantId,
            MoveOutDate = dto.MoveOutDate,
            AssignedHandlerId = dto.AssignedHandlerId,
            CoHandlerId = dto.CoHandlerId,
            Reason = dto.Reason,
            Status = MoveOutStatus.Pending,
            CreatedAt = DateTime.Now,
            CreatedBy = "system"
        };

        await _unitOfWork.MoveOutOrders.AddAsync(order);

        foreach (var src in dto.SourceRecords)
        {
            await _unitOfWork.SourceRecords.AddAsync(new SourceRecord
            {
                Id = Guid.NewGuid(),
                MoveOutOrderId = order.Id,
                SourceType = src.SourceType,
                SourceId = src.SourceId,
                SourceName = src.SourceName,
                OriginalData = src.OriginalData,
                Remarks = src.Remarks,
                CreatedAt = DateTime.Now,
                CreatedBy = "system"
            });
        }

        await _unitOfWork.SaveChangesAsync();

        await _timelineService.AddEventAsync(
            order.Id,
            TimelineEventType.Created,
            "退租单已创建",
            $"退租单 {orderNo} 已创建，退租日期：{dto.MoveOutDate:yyyy-MM-dd}",
            null, null, null, null, null, "系统",
            order.Id.ToString(),
            nameof(MoveOutOrder));

        return CreatedAtAction(nameof(GetOrder), new { id = order.Id }, dto);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateOrder(Guid id, [FromBody] UpdateMoveOutOrderDto dto)
    {
        var order = await _unitOfWork.MoveOutOrders.GetByIdAsync(id);
        if (order == null) return NotFound();

        if (dto.Status.HasValue && dto.Status.Value != order.Status)
        {
            var oldStatus = order.Status;
            order.Status = dto.Status.Value;
            await _timelineService.AddEventAsync(
                id,
                TimelineEventType.StatusChanged,
                "状态已更新",
                $"状态由 {oldStatus} 变更为 {dto.Status.Value}",
                oldStatus.ToString(),
                dto.Status.Value.ToString(),
                null, null, null, "系统",
                id.ToString(),
                nameof(MoveOutOrder));
        }

        if (dto.AssignedHandlerId.HasValue && dto.AssignedHandlerId.Value != order.AssignedHandlerId)
        {
            var oldHandler = order.AssignedHandlerId;
            order.AssignedHandlerId = dto.AssignedHandlerId.Value;
            var newHandler = await _unitOfWork.Staffs.GetByIdAsync(dto.AssignedHandlerId.Value);
            await _timelineService.AddEventAsync(
                id,
                TimelineEventType.HandlerChanged,
                "处理人已更新",
                $"处理人已变更为 {newHandler?.Name}",
                oldHandler?.ToString(),
                dto.AssignedHandlerId.Value.ToString(),
                null, null, dto.AssignedHandlerId.Value, newHandler?.Name,
                id.ToString(),
                nameof(MoveOutOrder));
        }

        order.MoveOutDate = dto.MoveOutDate ?? order.MoveOutDate;
        order.ActualMoveOutDate = dto.ActualMoveOutDate ?? order.ActualMoveOutDate;
        order.InspectionDate = dto.InspectionDate ?? order.InspectionDate;
        order.CoHandlerId = dto.CoHandlerId ?? order.CoHandlerId;
        order.Reason = dto.Reason ?? order.Reason;
        order.ReviewResult = dto.ReviewResult ?? order.ReviewResult;
        order.UpdatedAt = DateTime.Now;
        order.UpdatedBy = "system";

        _unitOfWork.MoveOutOrders.Update(order);
        await _unitOfWork.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet("export")]
    public async Task<IActionResult> ExportOrders([FromQuery] MoveOutOrderQueryDto query)
    {
        query.PageSize = 10000;
        var pagedResult = await QueryOrdersInternalAsync(query);
        var records = pagedResult.Items ?? new List<MoveOutOrderListDto>();

        using var ms = new MemoryStream();
        using var writer = new StreamWriter(ms, System.Text.Encoding.UTF8);
        using var csv = new CsvWriter(writer, new CsvConfiguration(System.Globalization.CultureInfo.InvariantCulture));

        csv.WriteField("退租单号");
        csv.WriteField("公寓号");
        csv.WriteField("楼栋");
        csv.WriteField("租客姓名");
        csv.WriteField("联系电话");
        csv.WriteField("退租日期");
        csv.WriteField("实际退租日期");
        csv.WriteField("状态");
        csv.WriteField("处理人");
        csv.WriteField("扣款金额");
        csv.WriteField("最终退款");
        csv.WriteField("是否租金逾期");
        csv.WriteField("待办数量");
        csv.WriteField("创建时间");
        csv.NextRecord();

        foreach (var r in records)
        {
            csv.WriteField(r.OrderNumber);
            csv.WriteField(r.ApartmentNumber);
            csv.WriteField(r.Building);
            csv.WriteField(r.TenantName);
            csv.WriteField(r.TenantPhone);
            csv.WriteField(r.MoveOutDate.ToString("yyyy-MM-dd"));
            csv.WriteField(r.ActualMoveOutDate?.ToString("yyyy-MM-dd") ?? "");
            csv.WriteField(r.Status.ToString());
            csv.WriteField(r.AssignedHandlerName ?? "");
            csv.WriteField(r.TotalDeduction?.ToString("F2") ?? "");
            csv.WriteField(r.FinalRefund?.ToString("F2") ?? "");
            csv.WriteField(r.HasOverdueRent ? "是" : "否");
            csv.WriteField(r.PendingTodos);
            csv.WriteField(r.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss"));
            csv.NextRecord();
        }

        writer.Flush();
        ms.Position = 0;
        var bytes = ms.ToArray();
        return File(bytes, "text/csv; charset=utf-8", $"退租单_{DateTime.Now:yyyyMMdd_HHmmss}.csv");
    }
}
