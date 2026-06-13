using FitnessDietTracker.API.Data;
using FitnessDietTracker.API.Dtos;
using FitnessDietTracker.API.Enums;
using FitnessDietTracker.API.Models;
using Microsoft.EntityFrameworkCore;

namespace FitnessDietTracker.API.Services;

public class NotificationService : INotificationService
{
    private readonly AppDbContext _context;

    public NotificationService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<NotificationDto>> GetByUserIdAsync(int userId, NotificationStatus? status = null, int page = 1, int pageSize = 20)
    {
        var query = _context.Notifications
            .Include(n => n.Creator)
            .Where(n => n.UserId == userId);

        if (status.HasValue)
            query = query.Where(n => n.Status == status.Value);

        return await query
            .OrderByDescending(n => n.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(n => MapToDto(n))
            .ToListAsync();
    }

    public async Task<int> GetUnreadCountAsync(int userId)
    {
        return await _context.Notifications
            .CountAsync(n => n.UserId == userId && n.Status == NotificationStatus.Unread);
    }

    public async Task<NotificationDto> CreateAsync(CreateNotificationDto dto)
    {
        var notification = new Notification
        {
            UserId = dto.UserId,
            Type = dto.Type,
            Title = dto.Title,
            Content = dto.Content,
            RelatedId = dto.RelatedId,
            RelatedType = dto.RelatedType,
            Status = NotificationStatus.Unread,
            CreatedBy = dto.CreatedBy,
            CreatedAt = DateTime.UtcNow
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();
        await _context.Entry(notification).Reference(n => n.Creator).LoadAsync();
        return MapToDto(notification);
    }

    public async Task<bool> MarkAsReadAsync(int id, int userId)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

        if (notification == null) return false;

        notification.Status = NotificationStatus.Read;
        notification.ReadAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<int> MarkAllAsReadAsync(int userId)
    {
        var notifications = await _context.Notifications
            .Where(n => n.UserId == userId && n.Status == NotificationStatus.Unread)
            .ToListAsync();

        foreach (var n in notifications)
        {
            n.Status = NotificationStatus.Read;
            n.ReadAt = DateTime.UtcNow;
        }

        return await _context.SaveChangesAsync();
    }

    private static NotificationDto MapToDto(Notification n) => new()
    {
        Id = n.Id,
        UserId = n.UserId,
        UserName = string.Empty,
        Type = n.Type,
        Title = n.Title,
        Content = n.Content,
        RelatedId = n.RelatedId,
        RelatedType = n.RelatedType,
        Status = n.Status,
        ReadAt = n.ReadAt,
        CreatedBy = n.CreatedBy,
        CreatedByName = !n.CreatedBy.HasValue ? "系统" : (n.Creator?.UserName ?? "未知"),
        CreatedAt = n.CreatedAt
    };
}
