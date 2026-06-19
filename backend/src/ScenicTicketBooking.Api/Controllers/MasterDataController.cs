using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScenicTicketBooking.Domain.Entities;
using ScenicTicketBooking.Domain.Interfaces;
using ScenicTicketBooking.Shared.DTOs;

namespace ScenicTicketBooking.Api.Controllers;

[ApiController]
[Route("api/masterdata")]
[Produces("application/json")]
public class MasterDataController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;

    public MasterDataController(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    #region ScenicSpots

    [HttpGet("scenicspots")]
    public async Task<ActionResult<IEnumerable<ScenicSpot>>> GetScenicSpots(CancellationToken cancellationToken)
    {
        var result = await _unitOfWork.Query<ScenicSpot>()
            .Where(s => s.IsActive)
            .OrderBy(s => s.Name)
            .ToListAsync(cancellationToken);
        return Ok(result);
    }

    [HttpGet("scenicspots/{id:guid}")]
    public async Task<ActionResult<ScenicSpot>> GetScenicSpotById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _unitOfWork.ScenicSpots.GetByIdAsync(id, cancellationToken);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost("scenicspots")]
    public async Task<ActionResult<ScenicSpot>> CreateScenicSpot([FromBody] ScenicSpot dto, CancellationToken cancellationToken)
    {
        dto.Id = Guid.NewGuid();
        dto.CreatedAt = DateTime.UtcNow;
        dto.IsActive = true;
        var result = await _unitOfWork.ScenicSpots.AddAsync(dto, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(GetScenicSpotById), new { id = result.Id }, result);
    }

    [HttpPut("scenicspots/{id:guid}")]
    public async Task<IActionResult> UpdateScenicSpot(Guid id, [FromBody] ScenicSpot dto, CancellationToken cancellationToken)
    {
        var entity = await _unitOfWork.ScenicSpots.GetByIdAsync(id, cancellationToken);
        if (entity == null) return NotFound();
        entity.Name = dto.Name;
        entity.Description = dto.Description;
        entity.Address = dto.Address;
        entity.OpeningTime = dto.OpeningTime;
        entity.ClosingTime = dto.ClosingTime;
        entity.MaxDailyCapacity = dto.MaxDailyCapacity;
        entity.IsActive = dto.IsActive;
        entity.UpdatedAt = DateTime.UtcNow;
        _unitOfWork.ScenicSpots.Update(entity);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Ok(entity);
    }

    #endregion

    #region TimeSlots

    [HttpGet("scenicspots/{scenicSpotId:guid}/timeslots")]
    public async Task<ActionResult<IEnumerable<TimeSlot>>> GetTimeSlots(
        Guid scenicSpotId,
        [FromQuery] string? date,
        [FromQuery] DateOnly? startDate,
        [FromQuery] DateOnly? endDate,
        CancellationToken cancellationToken)
    {
        var query = _unitOfWork.Query<TimeSlot>()
            .Where(t => t.ScenicSpotId == scenicSpotId && t.IsActive);

        if (!string.IsNullOrWhiteSpace(date) && DateOnly.TryParse(date, out var d))
        {
            query = query.Where(t => t.Date == d);
        }
        else
        {
            if (startDate.HasValue) query = query.Where(t => t.Date >= startDate.Value);
            if (endDate.HasValue) query = query.Where(t => t.Date <= endDate.Value);
        }

        var result = await query
            .OrderBy(t => t.Date)
            .ThenBy(t => t.StartTime)
            .ToListAsync(cancellationToken);
        return Ok(result);
    }

    [HttpPost("timeslots/bulk-generate")]
    [ProducesResponseType(typeof(IEnumerable<TimeSlot>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<TimeSlot>>> BulkGenerateTimeSlots(
        [FromBody] BulkTimeSlotGenerateRequest request,
        CancellationToken cancellationToken)
    {
        if (request.EndDate < request.StartDate)
            return BadRequest(new { message = "结束日期不能早于开始日期" });

        var created = new List<TimeSlot>();
        for (var date = request.StartDate; date <= request.EndDate; date = date.AddDays(1))
        {
            foreach (var range in request.TimeRanges)
            {
                var entity = new TimeSlot
                {
                    Id = Guid.NewGuid(),
                    ScenicSpotId = request.ScenicSpotId,
                    Date = date,
                    StartTime = range.StartTime,
                    EndTime = range.EndTime,
                    Capacity = request.Capacity,
                    BookedCount = 0,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                await _unitOfWork.TimeSlots.AddAsync(entity, cancellationToken);
                created.Add(entity);
            }
        }
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Ok(created);
    }

    #endregion

    #region TicketTypes

    [HttpGet("tickettypes")]
    public async Task<ActionResult<IEnumerable<TicketType>>> GetTicketTypes(
        [FromQuery] Guid? scenicSpotId,
        CancellationToken cancellationToken)
    {
        var query = _unitOfWork.Query<TicketType>()
            .Where(t => t.IsActive);
        if (scenicSpotId.HasValue)
            query = query.Where(t => t.ScenicSpotId == scenicSpotId.Value);

        var result = await query
            .OrderBy(t => t.SortOrder)
            .ThenBy(t => t.Name)
            .ToListAsync(cancellationToken);
        return Ok(result);
    }

    [HttpPost("tickettypes")]
    public async Task<ActionResult<TicketType>> CreateTicketType(
        [FromBody] TicketType dto,
        CancellationToken cancellationToken)
    {
        dto.Id = Guid.NewGuid();
        dto.CreatedAt = DateTime.UtcNow;
        dto.IsActive = true;
        var result = await _unitOfWork.TicketTypes.AddAsync(dto, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Ok(result);
    }

    #endregion

    #region Visitors

    [HttpGet("visitors")]
    [ProducesResponseType(typeof(PagedResult<Visitor>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<Visitor>>> GetVisitors(
        [FromQuery] string? keyword,
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = _unitOfWork.Query<Visitor>();
        if (!string.IsNullOrWhiteSpace(keyword))
        {
            query = query.Where(v =>
                v.Name.Contains(keyword) ||
                v.IdCardNumber.Contains(keyword) ||
                (v.PhoneNumber != null && v.PhoneNumber.Contains(keyword)));
        }

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(v => v.CreatedAt)
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return Ok(new PagedResult<Visitor>
        {
            Items = items,
            TotalCount = total,
            PageIndex = pageIndex,
            PageSize = pageSize
        });
    }

    [HttpPost("visitors")]
    [ProducesResponseType(typeof(Visitor), StatusCodes.Status200OK)]
    public async Task<ActionResult<Visitor>> CreateVisitor(
        [FromBody] Visitor dto,
        CancellationToken cancellationToken)
    {
        var existing = await _unitOfWork.Query<Visitor>()
            .FirstOrDefaultAsync(v => v.IdCardNumber == dto.IdCardNumber, cancellationToken);

        if (existing != null)
        {
            existing.Name = dto.Name;
            existing.PhoneNumber = dto.PhoneNumber;
            existing.Email = dto.Email;
            existing.Gender = dto.Gender;
            existing.Age = dto.Age;
            existing.Remarks = dto.Remarks;
            existing.IsBlacklisted = dto.IsBlacklisted;
            existing.BlacklistReason = dto.BlacklistReason;
            existing.UpdatedAt = DateTime.UtcNow;
            _unitOfWork.Visitors.Update(existing);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return Ok(existing);
        }

        dto.Id = Guid.NewGuid();
        dto.CreatedAt = DateTime.UtcNow;
        var result = await _unitOfWork.Visitors.AddAsync(dto, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Ok(result);
    }

    [HttpPut("visitors/{id:guid}")]
    [ProducesResponseType(typeof(Visitor), StatusCodes.Status200OK)]
    public async Task<ActionResult<Visitor>> UpdateVisitor(
        Guid id,
        [FromBody] Visitor dto,
        CancellationToken cancellationToken)
    {
        var existing = await _unitOfWork.Visitors.GetByIdAsync(id, cancellationToken);
        if (existing == null) return NotFound();

        existing.Name = dto.Name;
        existing.IdCardNumber = dto.IdCardNumber;
        existing.PhoneNumber = dto.PhoneNumber;
        existing.Email = dto.Email;
        existing.Gender = dto.Gender;
        existing.Age = dto.Age;
        existing.Remarks = dto.Remarks;
        existing.IsBlacklisted = dto.IsBlacklisted;
        existing.BlacklistReason = dto.BlacklistReason;
        existing.UpdatedAt = DateTime.UtcNow;
        _unitOfWork.Visitors.Update(existing);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Ok(existing);
    }

    #endregion
}

public class BulkTimeSlotGenerateRequest
{
    public Guid ScenicSpotId { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public int Capacity { get; set; } = 100;
    public List<TimeRangeItem> TimeRanges { get; set; } = new();
}

public class TimeRangeItem
{
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
}
