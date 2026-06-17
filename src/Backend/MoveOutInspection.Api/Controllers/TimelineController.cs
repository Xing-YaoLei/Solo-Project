
using Microsoft.AspNetCore.Mvc;
using MoveOutInspection.Core.DTOs.Timeline;
using MoveOutInspection.Core.Enums;
using MoveOutInspection.Core.Interfaces;
using MoveOutInspection.Infrastructure.Services;

namespace MoveOutInspection.Api.Controllers;

[ApiController]
[Route("api/moveoutorders/{orderId}/[controller]")]
public class TimelineController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITimelineService _timelineService;

    public TimelineController(IUnitOfWork unitOfWork, ITimelineService timelineService)
    {
        _unitOfWork = unitOfWork;
        _timelineService = timelineService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TimelineEventDto>>> GetTimeline(Guid orderId)
    {
        var events = await _unitOfWork.TimelineEvents.FindAsync(e => e.MoveOutOrderId == orderId);
        var dtos = events
            .OrderByDescending(e => e.EventTime)
            .Select(e => new TimelineEventDto
            {
                Id = e.Id,
                EventType = e.EventType,
                Title = e.Title,
                Description = e.Description,
                PreviousValue = e.PreviousValue,
                NewValue = e.NewValue,
                Notes = e.Notes,
                AttachmentUrls = e.AttachmentUrls,
                ActorId = e.ActorId,
                ActorName = e.ActorName,
                EventTime = e.EventTime,
                ReferenceId = e.ReferenceId,
                ReferenceType = e.ReferenceType
            }).ToList();

        return Ok(dtos);
    }

    [HttpPost("note")]
    public async Task<IActionResult> AddNote(Guid orderId, [FromBody] CreateTimelineNoteDto dto)
    {
        var order = await _unitOfWork.MoveOutOrders.GetByIdAsync(orderId);
        if (order == null) return NotFound();

        await _timelineService.AddEventAsync(
            orderId,
            TimelineEventType.NoteAdded,
            "添加了备注",
            null, null, null, dto.Notes, dto.AttachmentUrls,
            null, "当前用户",
            null,
            null);

        return Ok();
    }
}
