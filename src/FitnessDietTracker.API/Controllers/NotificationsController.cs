using FitnessDietTracker.API.Dtos;
using FitnessDietTracker.API.Enums;
using FitnessDietTracker.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FitnessDietTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _service;

    public NotificationsController(INotificationService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<List<NotificationDto>>> GetMyNotifications(
        [FromQuery] int userId,
        [FromQuery] NotificationStatus? status = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        return Ok(await _service.GetByUserIdAsync(userId, status, page, pageSize));
    }

    [HttpGet("unread-count")]
    public async Task<ActionResult<int>> GetUnreadCount([FromQuery] int userId)
    {
        return Ok(new { count = await _service.GetUnreadCountAsync(userId) });
    }

    [HttpPut("{id}/read")]
    public async Task<IActionResult> MarkAsRead(int id, [FromQuery] int userId)
    {
        var success = await _service.MarkAsReadAsync(id, userId);
        if (!success) return NotFound();
        return Ok(new { success = true });
    }

    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllAsRead([FromQuery] int userId)
    {
        var count = await _service.MarkAllAsReadAsync(userId);
        return Ok(new { count });
    }

    [HttpPost]
    public async Task<ActionResult<NotificationDto>> Create([FromBody] CreateNotificationDto dto)
    {
        var result = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetMyNotifications), new { userId = dto.UserId }, result);
    }
}
