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

    [HttpPost("{id:guid}/mark-arrival")]
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
        [FromBody] CancelBookingRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _bookingService.CancelBookingAsync(
                id, request.Reason, request.OperatorName, cancellationToken);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost("precheck-conflicts")]
    [ProducesResponseType(typeof(PrecheckConflictResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<PrecheckConflictResponse>> PrecheckConflicts(
        [FromBody] PrecheckConflictRequest request,
        CancellationToken cancellationToken)
    {
        var warnings = new List<string>();

        if (request.TimeSlotId != Guid.Empty)
        {
            ConflictDetectionResult? result = null;

            if (!string.IsNullOrWhiteSpace(request.VisitorIdCard))
            {
                result = await _conflictService.CheckConflictsByIdCardAsync(
                    request.ScenicSpotId,
                    request.TimeSlotId,
                    request.VisitorIdCard,
                    request.Quantity,
                    cancellationToken);
            }
            else if (request.VisitorId.HasValue && request.VisitorId != Guid.Empty)
            {
                result = await _conflictService.CheckConflictsForBookingAsync(
                    request.ScenicSpotId,
                    request.TimeSlotId,
                    request.VisitorId.Value,
                    request.Quantity,
                    cancellationToken);
            }
            else
            {
                var timeSlot = await _conflictService.CheckConflictsForBookingAsync(
                    request.ScenicSpotId,
                    request.TimeSlotId,
                    Guid.Empty,
                    request.Quantity,
                    cancellationToken);
                var onlyCapacity = new ConflictDetectionResult();
                foreach (var c in timeSlot.Conflicts.Where(c => c.ConflictType == Domain.Enums.ConflictType.CapacityExceeded))
                    onlyCapacity.Conflicts.Add(c);
                onlyCapacity.HasConflict = onlyCapacity.Conflicts.Any();
                result = onlyCapacity;
            }

            if (result != null && result.HasConflict)
            {
                warnings.AddRange(result.Conflicts.Select(c => $"{c.ConflictType}: {c.Reason}"));
            }
        }

        return Ok(new PrecheckConflictResponse
        {
            HasWarnings = warnings.Count > 0,
            Warnings = warnings
        });
    }
}

public class CancelBookingRequest
{
    public string Reason { get; set; } = string.Empty;
    public string OperatorName { get; set; } = string.Empty;
}

public class PrecheckConflictRequest
{
    public Guid ScenicSpotId { get; set; }
    public Guid TimeSlotId { get; set; }
    public Guid? VisitorId { get; set; }
    public string? VisitorIdCard { get; set; }
    public int Quantity { get; set; } = 1;
    public string? SlotDate { get; set; }
}

public class PrecheckConflictResponse
{
    public bool HasWarnings { get; set; }
    public List<string> Warnings { get; set; } = new();
}
