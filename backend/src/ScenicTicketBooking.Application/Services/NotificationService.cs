using Microsoft.EntityFrameworkCore;
using ScenicTicketBooking.Domain.Entities;
using ScenicTicketBooking.Domain.Enums;
using ScenicTicketBooking.Domain.Interfaces;
using ScenicTicketBooking.Shared.DTOs;

namespace ScenicTicketBooking.Application.Services;

public interface INotificationService
{
    Task<Notification> CreateNotificationAsync(NotificationChannel channel, string title, string content, string? recipient, Guid? conflictLogId, CancellationToken cancellationToken = default);
    Task<IEnumerable<NotificationDto>> GetNotificationsAsync(string? recipient = null, bool? isRead = null, int limit = 50, CancellationToken cancellationToken = default);
    Task<int> GetUnreadCountAsync(string? recipient = null, CancellationToken cancellationToken = default);
    Task<bool> MarkAsReadAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> MarkAllAsReadAsync(string? recipient = null, CancellationToken cancellationToken = default);
    Task SendPendingNotificationsAsync(CancellationToken cancellationToken = default);
    Task<bool> SendCustomNotificationAsync(SendNotificationDto dto, CancellationToken cancellationToken = default);
}

public class NotificationService : INotificationService
{
    private readonly IUnitOfWork _unitOfWork;

    public NotificationService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Notification> CreateNotificationAsync(
        NotificationChannel channel,
        string title,
        string content,
        string? recipient,
        Guid? conflictLogId,
        CancellationToken cancellationToken = default)
    {
        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            Channel = channel,
            Title = title,
            Content = content,
            Recipient = recipient,
            ConflictLogId = conflictLogId,
            IsRead = false,
            IsSent = channel == NotificationChannel.System,
            SentAt = channel == NotificationChannel.System ? DateTime.UtcNow : null,
            RetryCount = 0,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Notifications.AddAsync(notification, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return notification;
    }

    public async Task<IEnumerable<NotificationDto>> GetNotificationsAsync(
        string? recipient = null,
        bool? isRead = null,
        int limit = 50,
        CancellationToken cancellationToken = default)
    {
        var queryable = (_unitOfWork.Notifications as IQueryable<Notification>)!;

        if (!string.IsNullOrWhiteSpace(recipient))
            queryable = queryable.Where(n => n.Recipient == recipient);

        if (isRead.HasValue)
            queryable = queryable.Where(n => n.IsRead == isRead.Value);

        queryable = queryable
            .OrderByDescending(n => n.CreatedAt)
            .Take(limit);

        return await queryable.Select(n => new NotificationDto
        {
            Id = n.Id,
            Channel = n.Channel,
            Title = n.Title,
            Content = n.Content,
            Recipient = n.Recipient,
            ConflictLogId = n.ConflictLogId,
            IsRead = n.IsRead,
            ReadAt = n.ReadAt,
            IsSent = n.IsSent,
            SentAt = n.SentAt,
            RetryCount = n.RetryCount,
            CreatedAt = n.CreatedAt
        }).ToListAsync(cancellationToken);
    }

    public async Task<int> GetUnreadCountAsync(string? recipient = null, CancellationToken cancellationToken = default)
    {
        var queryable = (_unitOfWork.Notifications as IQueryable<Notification>)!
            .Where(n => !n.IsRead && n.Channel == NotificationChannel.System);

        if (!string.IsNullOrWhiteSpace(recipient))
            queryable = queryable.Where(n => n.Recipient == recipient);

        return await queryable.CountAsync(cancellationToken);
    }

    public async Task<bool> MarkAsReadAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var notification = await _unitOfWork.Notifications.GetByIdAsync(id, cancellationToken);
        if (notification == null) return false;

        notification.IsRead = true;
        notification.ReadAt = DateTime.UtcNow;
        _unitOfWork.Notifications.Update(notification);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> MarkAllAsReadAsync(string? recipient = null, CancellationToken cancellationToken = default)
    {
        var queryable = (_unitOfWork.Notifications as IQueryable<Notification>)!
            .Where(n => !n.IsRead && n.Channel == NotificationChannel.System);

        if (!string.IsNullOrWhiteSpace(recipient))
            queryable = queryable.Where(n => n.Recipient == recipient);

        var notifications = await queryable.ToListAsync(cancellationToken);

        foreach (var n in notifications)
        {
            n.IsRead = true;
            n.ReadAt = DateTime.UtcNow;
            _unitOfWork.Notifications.Update(n);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task SendPendingNotificationsAsync(CancellationToken cancellationToken = default)
    {
        var pendingNotifications = await (_unitOfWork.Notifications as IQueryable<Notification>)!
            .Where(n => !n.IsSent && n.Channel != NotificationChannel.System && n.RetryCount < 3)
            .ToListAsync(cancellationToken);

        foreach (var notification in pendingNotifications)
        {
            try
            {
                notification.IsSent = true;
                notification.SentAt = DateTime.UtcNow;
                notification.RetryCount++;
                _unitOfWork.Notifications.Update(notification);
            }
            catch (Exception ex)
            {
                notification.RetryCount++;
                notification.SendErrorMessage = ex.Message;
                _unitOfWork.Notifications.Update(notification);
            }
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<bool> SendCustomNotificationAsync(SendNotificationDto dto, CancellationToken cancellationToken = default)
    {
        var reminderLists = await (_unitOfWork.ReminderLists as IQueryable<ReminderList>)!
            .Include(r => r.Items)
            .Where(r => dto.ReminderListIds.Contains(r.Id) && r.IsActive)
            .ToListAsync(cancellationToken);

        foreach (var list in reminderLists)
        {
            foreach (var item in list.Items.Where(i => i.IsActive))
            {
                foreach (var channel in dto.Channels)
                {
                    var recipient = channel switch
                    {
                        NotificationChannel.Email => item.Email,
                        NotificationChannel.SMS => item.PhoneNumber,
                        NotificationChannel.DingTalk => item.PhoneNumber,
                        NotificationChannel.WeChat => item.PhoneNumber,
                        _ => item.PersonName
                    };

                    if (!string.IsNullOrEmpty(recipient))
                    {
                        await CreateNotificationAsync(
                            channel,
                            dto.Title,
                            dto.Content,
                            recipient,
                            null,
                            cancellationToken);
                    }
                }
            }
        }

        return true;
    }
}
