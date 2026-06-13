using FitnessDietTracker.API.Dtos;
using FitnessDietTracker.API.Enums;

namespace FitnessDietTracker.API.Services;

public interface INotificationService
{
    Task<List<NotificationDto>> GetByUserIdAsync(int userId, NotificationStatus? status = null, int page = 1, int pageSize = 20);
    Task<int> GetUnreadCountAsync(int userId);
    Task<NotificationDto> CreateAsync(CreateNotificationDto dto);
    Task<bool> MarkAsReadAsync(int id, int userId);
    Task<int> MarkAllAsReadAsync(int userId);
}
