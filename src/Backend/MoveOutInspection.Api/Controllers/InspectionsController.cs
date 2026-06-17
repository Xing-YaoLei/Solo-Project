
using Microsoft.AspNetCore.Mvc;
using MoveOutInspection.Core.DTOs.Inspection;
using MoveOutInspection.Core.Entities;
using MoveOutInspection.Core.Enums;
using MoveOutInspection.Core.Interfaces;
using MoveOutInspection.Infrastructure.Services;

namespace MoveOutInspection.Api.Controllers;

[ApiController]
[Route("api/moveoutorders/{orderId}/[controller]")]
public class InspectionsController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITimelineService _timelineService;

    public InspectionsController(IUnitOfWork unitOfWork, ITimelineService timelineService)
    {
        _unitOfWork = unitOfWork;
        _timelineService = timelineService;
    }

    [HttpGet("items")]
    public async Task<ActionResult<IEnumerable<InspectionItemDto>>> GetInspectionItems()
    {
        var templates = await _unitOfWork.InspectionTemplates.GetAllAsync();
        var templateId = templates.FirstOrDefault()?.Id;
        if (!templateId.HasValue) return Ok(new List<InspectionItemDto>());

        var items = await _unitOfWork.InspectionItems.FindAsync(i => i.InspectionTemplateId == templateId.Value);
        var dtos = items.OrderBy(i => i.SortOrder).Select(i => new InspectionItemDto
        {
            Id = i.Id,
            Name = i.Name,
            Category = i.Category,
            Description = i.Description,
            StandardValue = i.StandardValue,
            SortOrder = i.SortOrder
        }).ToList();

        return Ok(dtos);
    }

    [HttpGet]
    public async Task<ActionResult<InspectionSummaryDto>> GetRecords(Guid orderId)
    {
        var records = await _unitOfWork.InspectionRecords.FindAsync(r => r.MoveOutOrderId == orderId);
        var dtos = new List<InspectionRecordDto>();
        int normal = 0, minor = 0, major = 0, missing = 0, notChecked = 0;
        decimal totalCost = 0;
        DateTime? lastTime = null;

        foreach (var r in records)
        {
            var item = await _unitOfWork.InspectionItems.GetByIdAsync(r.InspectionItemId);
            var inspectedBy = await _unitOfWork.Staffs.GetByIdAsync(r.InspectedById);
            dtos.Add(new InspectionRecordDto
            {
                Id = r.Id,
                InspectionItemId = r.InspectionItemId,
                ItemName = item?.Name ?? string.Empty,
                ItemCategory = item?.Category ?? string.Empty,
                Status = r.Status,
                Responsibility = r.Responsibility,
                EstimatedCost = r.EstimatedCost,
                Description = r.Description,
                PhotoUrls = r.PhotoUrls,
                Remarks = r.Remarks,
                InspectedById = r.InspectedById,
                InspectedByName = inspectedBy?.Name,
                InspectedAt = r.InspectedAt
            });

            switch (r.Status)
            {
                case InspectionItemStatus.Normal: normal++; break;
                case InspectionItemStatus.MinorDamage: minor++; break;
                case InspectionItemStatus.MajorDamage: major++; break;
                case InspectionItemStatus.Missing: missing++; break;
                default: notChecked++; break;
            }
            if (r.EstimatedCost.HasValue) totalCost += r.EstimatedCost.Value;
            if (!lastTime.HasValue || r.InspectedAt > lastTime) lastTime = r.InspectedAt;
        }

        return Ok(new InspectionSummaryDto
        {
            MoveOutOrderId = orderId,
            TotalItems = records.Count,
            NormalItems = normal,
            MinorDamageItems = minor,
            MajorDamageItems = major,
            MissingItems = missing,
            NotCheckedItems = notChecked,
            TotalEstimatedCost = totalCost,
            LastInspectedAt = lastTime
        });
    }

    [HttpGet("records")]
    public async Task<ActionResult<IEnumerable<InspectionRecordDto>>> GetRecordList(Guid orderId)
    {
        var records = await _unitOfWork.InspectionRecords.FindAsync(r => r.MoveOutOrderId == orderId);
        var dtos = new List<InspectionRecordDto>();
        foreach (var r in records)
        {
            var item = await _unitOfWork.InspectionItems.GetByIdAsync(r.InspectionItemId);
            var inspectedBy = await _unitOfWork.Staffs.GetByIdAsync(r.InspectedById);
            dtos.Add(new InspectionRecordDto
            {
                Id = r.Id,
                InspectionItemId = r.InspectionItemId,
                ItemName = item?.Name ?? string.Empty,
                ItemCategory = item?.Category ?? string.Empty,
                Status = r.Status,
                Responsibility = r.Responsibility,
                EstimatedCost = r.EstimatedCost,
                Description = r.Description,
                PhotoUrls = r.PhotoUrls,
                Remarks = r.Remarks,
                InspectedById = r.InspectedById,
                InspectedByName = inspectedBy?.Name,
                InspectedAt = r.InspectedAt
            });
        }
        return Ok(dtos);
    }

    [HttpPost]
    public async Task<ActionResult<InspectionRecordDto>> CreateRecord(Guid orderId, [FromBody] CreateInspectionRecordDto dto)
    {
        var order = await _unitOfWork.MoveOutOrders.GetByIdAsync(orderId);
        if (order == null) return NotFound();

        var record = new InspectionRecord
        {
            Id = Guid.NewGuid(),
            MoveOutOrderId = orderId,
            InspectionItemId = dto.InspectionItemId,
            Status = dto.Status,
            Responsibility = dto.Responsibility,
            EstimatedCost = dto.EstimatedCost,
            Description = dto.Description,
            PhotoUrls = dto.PhotoUrls,
            Remarks = dto.Remarks,
            InspectedById = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            InspectedAt = DateTime.Now,
            CreatedAt = DateTime.Now,
            CreatedBy = "system"
        };

        await _unitOfWork.InspectionRecords.AddAsync(record);
        await _unitOfWork.SaveChangesAsync();

        var item = await _unitOfWork.InspectionItems.GetByIdAsync(dto.InspectionItemId);
        await _timelineService.AddEventAsync(
            orderId,
            TimelineEventType.InspectionDone,
            $"验房记录：{item?.Name ?? "未知项目"}",
            $"状态：{dto.Status}，责任方：{dto.Responsibility}{(dto.EstimatedCost.HasValue ? $"，预估费用：¥{dto.EstimatedCost.Value:F2}" : "")}",
            null, null, dto.Remarks, dto.PhotoUrls,
            record.InspectedById, "张伟",
            record.Id.ToString(),
            nameof(InspectionRecord));

        var inspectedBy = await _unitOfWork.Staffs.GetByIdAsync(record.InspectedById);
        return CreatedAtAction(nameof(GetRecordList), new { orderId }, new InspectionRecordDto
        {
            Id = record.Id,
            InspectionItemId = record.InspectionItemId,
            ItemName = item?.Name ?? string.Empty,
            ItemCategory = item?.Category ?? string.Empty,
            Status = record.Status,
            Responsibility = record.Responsibility,
            EstimatedCost = record.EstimatedCost,
            Description = record.Description,
            PhotoUrls = record.PhotoUrls,
            Remarks = record.Remarks,
            InspectedById = record.InspectedById,
            InspectedByName = inspectedBy?.Name,
            InspectedAt = record.InspectedAt
        });
    }
}
