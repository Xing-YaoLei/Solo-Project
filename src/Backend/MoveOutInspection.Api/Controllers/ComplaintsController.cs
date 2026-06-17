
using Microsoft.AspNetCore.Mvc;
using MoveOutInspection.Core.DTOs.Complaint;
using MoveOutInspection.Core.Entities;
using MoveOutInspection.Core.Enums;
using MoveOutInspection.Core.Interfaces;
using MoveOutInspection.Infrastructure.Services;

namespace MoveOutInspection.Api.Controllers;

[ApiController]
[Route("api/moveoutorders/{orderId}/[controller]")]
public class ComplaintsController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITimelineService _timelineService;

    public ComplaintsController(IUnitOfWork unitOfWork, ITimelineService timelineService)
    {
        _unitOfWork = unitOfWork;
        _timelineService = timelineService;
    }

    [HttpGet]
    public async Task<ActionResult<ComplaintSummaryDto>> GetComplaints(Guid orderId)
    {
        var tags = await _unitOfWork.ComplaintTags.FindAsync(c => c.MoveOutOrderId == orderId);
        var dtos = new List<ComplaintTagDto>();
        int unresolved = 0, highSeverity = 0;

        foreach (var t in tags)
        {
            var taggedBy = t.TaggedById.HasValue ? await _unitOfWork.Staffs.GetByIdAsync(t.TaggedById.Value) : null;
            dtos.Add(new ComplaintTagDto
            {
                Id = t.Id,
                TagName = t.TagName,
                Category = t.Category,
                Description = t.Description,
                Severity = t.Severity,
                Source = t.Source,
                TaggedByName = taggedBy?.Name,
                TaggedAt = t.TaggedAt,
                IsResolved = t.IsResolved,
                Resolution = t.Resolution,
                ResolvedAt = t.ResolvedAt
            });

            if (!t.IsResolved) unresolved++;
            if (t.Severity >= 3) highSeverity++;
        }

        return Ok(new ComplaintSummaryDto
        {
            MoveOutOrderId = orderId,
            Tags = dtos,
            TotalCount = tags.Count,
            UnresolvedCount = unresolved,
            HighSeverityCount = highSeverity
        });
    }

    [HttpPost]
    public async Task<ActionResult<ComplaintTagDto>> CreateComplaint(Guid orderId, [FromBody] CreateComplaintTagDto dto)
    {
        var order = await _unitOfWork.MoveOutOrders.GetByIdAsync(orderId);
        if (order == null) return NotFound();

        var tag = new ComplaintTag
        {
            Id = Guid.NewGuid(),
            MoveOutOrderId = orderId,
            TagName = dto.TagName,
            Category = dto.Category,
            Description = dto.Description,
            Severity = dto.Severity,
            Source = dto.Source,
            TaggedById = Guid.Parse("44444444-4444-4444-4444-444444444444"),
            TaggedAt = DateTime.Now,
            IsResolved = false,
            CreatedAt = DateTime.Now,
            CreatedBy = "system"
        };

        await _unitOfWork.ComplaintTags.AddAsync(tag);
        await _unitOfWork.SaveChangesAsync();

        await _timelineService.AddEventAsync(
            orderId,
            TimelineEventType.ComplaintTagged,
            $"已添加投诉标签：{dto.TagName}",
            $"分类：{dto.Category}，严重程度：{dto.Severity}{(!string.IsNullOrWhiteSpace(dto.Description) ? $"，描述：{dto.Description}" : "")}",
            null, null, dto.Description, null,
            tag.TaggedById, "赵敏",
            tag.Id.ToString(),
            nameof(ComplaintTag));

        var taggedBy = tag.TaggedById.HasValue ? await _unitOfWork.Staffs.GetByIdAsync(tag.TaggedById.Value) : null;
        return CreatedAtAction(nameof(GetComplaints), new { orderId }, new ComplaintTagDto
        {
            Id = tag.Id,
            TagName = tag.TagName,
            Category = tag.Category,
            Description = tag.Description,
            Severity = tag.Severity,
            Source = tag.Source,
            TaggedByName = taggedBy?.Name,
            TaggedAt = tag.TaggedAt,
            IsResolved = tag.IsResolved,
            Resolution = tag.Resolution,
            ResolvedAt = tag.ResolvedAt
        });
    }
}
