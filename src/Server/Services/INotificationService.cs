using SiteSchedule.Dtos.Common;
using SiteSchedule.Dtos.Notification;

namespace SiteSchedule.Services;

public interface INotificationService
{
    Task<PagedResult<NotificationRecordDto>> GetPagedListAsync(NotificationQueryDto query);
    Task<NotificationRecordDto?> GetByIdAsync(int id);
    Task<NotificationRecordDto> CreateAsync(NotificationCreateDto dto);
    Task<bool> MarkAsReadAsync(int id);
    Task<int> MarkAllAsReadAsync(int? siteId = null);
    Task<int> GetUnreadCountAsync(int? siteId = null);
    Task<bool> SendNotificationAsync(NotificationCreateDto dto);
    Task CheckAndSendMaterialMissingNotificationsAsync();
}
