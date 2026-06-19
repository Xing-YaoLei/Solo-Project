using Microsoft.AspNetCore.Mvc;
using ScenicTicketBooking.Application.Services;
using ScenicTicketBooking.Shared.DTOs;

namespace ScenicTicketBooking.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<NotificationDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<NotificationDto>>> GetAll(
        [FromQuery] string? recipient,
        [FromQuery] bool? isRead,
        [FromQuery] int limit = 50,
        CancellationToken cancellationToken = default)
    {
        var result = await _notificationService.GetNotificationsAsync(recipient, isRead, limit, cancellationToken);
        return Ok(result);
    }

    [HttpGet("unread-count")]
    [ProducesResponseType(typeof(int), StatusCodes.Status200OK)]
    public async Task<ActionResult<int>> GetUnreadCount(
        [FromQuery] string? recipient,
        CancellationToken cancellationToken)
    {
        var count = await _notificationService.GetUnreadCountAsync(recipient, cancellationToken);
        return Ok(count);
    }

    [HttpPut("{id:guid}/read")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkAsRead(Guid id, CancellationToken cancellationToken)
    {
        var success = await _notificationService.MarkAsReadAsync(id, cancellationToken);
        if (!success) return NotFound();
        return Ok();
    }

    [HttpPut("read-all")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> MarkAllAsRead(
        [FromQuery] string? recipient,
        CancellationToken cancellationToken)
    {
        await _notificationService.MarkAllAsReadAsync(recipient, cancellationToken);
        return Ok();
    }

    [HttpPost("send")]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    public async Task<IActionResult> SendCustom(
        [FromBody] SendNotificationDto dto,
        CancellationToken cancellationToken)
    {
        await _notificationService.SendCustomNotificationAsync(dto, cancellationToken);
        return Accepted();
    }

    [HttpPost("send-pending")]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    public async Task<IActionResult> SendPending(CancellationToken cancellationToken)
    {
        await _notificationService.SendPendingNotificationsAsync(cancellationToken);
        return Accepted();
    }
}
