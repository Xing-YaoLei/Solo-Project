
using MoveOutInspection.Core.Entities;
using MoveOutInspection.Core.Enums;
using MoveOutInspection.Core.Interfaces;

namespace MoveOutInspection.Infrastructure.Services;

public interface ITimelineService
{
    Task AddEventAsync(Guid moveOutOrderId, TimelineEventType eventType, string title,
        string? description = null, string? previousValue = null, string? newValue = null,
        string? notes = null, ICollection<string>? attachmentUrls = null,
        Guid? actorId = null, string? actorName = null, string? referenceId = null, string? referenceType = null);
}

public class TimelineService : ITimelineService
{
    private readonly IUnitOfWork _unitOfWork;

    public TimelineService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task AddEventAsync(Guid moveOutOrderId, TimelineEventType eventType, string title,
        string? description = null, string? previousValue = null, string? newValue = null,
        string? notes = null, ICollection<string>? attachmentUrls = null,
        Guid? actorId = null, string? actorName = null, string? referenceId = null, string? referenceType = null)
    {
        var timelineEvent = new TimelineEvent
        {
            Id = Guid.NewGuid(),
            MoveOutOrderId = moveOutOrderId,
            EventType = eventType,
            Title = title,
            Description = description,
            PreviousValue = previousValue,
            NewValue = newValue,
            Notes = notes,
            AttachmentUrls = attachmentUrls,
            ActorId = actorId,
            ActorName = actorName,
            EventTime = DateTime.Now,
            ReferenceId = referenceId,
            ReferenceType = referenceType,
            CreatedAt = DateTime.Now,
            CreatedBy = actorName ?? "system"
        };

        await _unitOfWork.TimelineEvents.AddAsync(timelineEvent);
        await _unitOfWork.SaveChangesAsync();
    }
}
