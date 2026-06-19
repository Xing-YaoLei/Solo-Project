using Microsoft.AspNetCore.Mvc;
using ScenicTicketBooking.Application.Services;
using ScenicTicketBooking.Shared.DTOs;

namespace ScenicTicketBooking.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class BookingsController : ControllerBase
{
    private readonly IBookingService _bookingService;
    private readonly IConflictDetectionService _conflictService;

    public BookingsController(IBookingService bookingService, IConflictDetectionService conflictService)
    {
        _bookingService = bookingService;
        _conflictService = conflictService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<BookingRecordDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<BookingRecordDto>>> GetPaged(
        [FromQuery] BookingQueryDto query,
        CancellationToken cancellationToken)
    {
        var result = await _bookingService.GetPagedBookingsAsync(query, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(BookingRecordDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BookingRecordDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _bookingService.GetBookingByIdAsync(id, cancellationToken);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(BookingRecordDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<BookingRecordDto>> Create(
        [FromBody] CreateBookingDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _bookingService.CreateBookingAsync(dto, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(BookingRecordDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BookingRecordDto>> Update(
        Guid id,
        [FromBody] UpdateBookingDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _bookingService.UpdateBookingAsync(id, dto, cancellationToken);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var success = await _bookingService.DeleteBookingAsync(id, cancellationToken);
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpPost("{id:guid}/reschedule")]
    [ProducesResponseType(typeof(BookingRecordDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<BookingRecordDto>> Reschedule(
        Guid id,
        [FromBody] RescheduleBookingDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _bookingService.RescheduleBookingAsync(id, dto, cancellationToken);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id:guid}/arrival")]
    [ProducesResponseType(typeof(BookingRecordDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<BookingRecordDto>> MarkArrival(
        Guid id,
        [FromBody] MarkArrivalDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _bookingService.MarkArrivalAsync(id, dto, cancellationToken);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id:guid}/cancel")]
    [ProducesResponseType(typeof(BookingRecordDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BookingRecordDto>> Cancel(
        Guid id,
        [FromQuery] string reason,
        [FromQuery] string operatorName,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _bookingService.CancelBookingAsync(id, reason, operatorName, cancellationToken);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpGet("check-conflicts")]
    [ProducesResponseType(typeof(ConflictDetectionResult), StatusCodes.Status200OK)]
    public async Task<ActionResult<ConflictDetectionResult>> CheckConflicts(
        [FromQuery] Guid scenicSpotId,
        [FromQuery] Guid timeSlotId,
        [FromQuery] Guid visitorId,
        [FromQuery] int quantity = 1,
        CancellationToken cancellationToken = default)
    {
        var result = await _conflictService.CheckConflictsForBookingAsync(
            scenicSpotId, timeSlotId, visitorId, quantity, cancellationToken);
        return Ok(result);
    }
}
