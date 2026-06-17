using Microsoft.AspNetCore.Mvc;
using SiteSchedule.Dtos.Common;
using SiteSchedule.Dtos.Notification;
using SiteSchedule.Services;

namespace SiteSchedule.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _service;

    public NotificationsController(INotificationService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ApiResponse<PagedResult<NotificationRecordDto>>> GetPagedList([FromQuery] NotificationQueryDto query)
    {
        var result = await _service.GetPagedListAsync(query);
        return ApiResponse<PagedResult<NotificationRecordDto>>.Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ApiResponse<NotificationRecordDto>> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        if (result == null)
            return ApiResponse<NotificationRecordDto>.Fail("通知不存在", 404);

        return ApiResponse<NotificationRecordDto>.Ok(result);
    }

    [HttpPost]
    public async Task<ApiResponse<NotificationRecordDto>> Create([FromBody] NotificationCreateDto dto)
    {
        var result = await _service.CreateAsync(dto);
        return ApiResponse<NotificationRecordDto>.Ok(result, "创建成功");
    }

    [HttpPut("{id}/read")]
    public async Task<ApiResponse> MarkAsRead(int id)
    {
        var result = await _service.MarkAsReadAsync(id);
        if (!result)
            return ApiResponse.Fail("标记失败，通知不存在", 404);

        return ApiResponse.Ok("标记成功");
    }

    [HttpPut("read-all")]
    public async Task<ApiResponse<int>> MarkAllAsRead([FromQuery] int? siteId)
    {
        var count = await _service.MarkAllAsReadAsync(siteId);
        return ApiResponse<int>.Ok(count, $"已标记 {count} 条通知为已读");
    }

    [HttpGet("unread-count")]
    public async Task<ApiResponse<int>> GetUnreadCount([FromQuery] int? siteId)
    {
        var count = await _service.GetUnreadCountAsync(siteId);
        return ApiResponse<int>.Ok(count);
    }

    [HttpPost("send")]
    public async Task<ApiResponse> SendNotification([FromBody] NotificationCreateDto dto)
    {
        var result = await _service.SendNotificationAsync(dto);
        if (!result)
            return ApiResponse.Fail("发送失败");

        return ApiResponse.Ok("发送成功");
    }
}
