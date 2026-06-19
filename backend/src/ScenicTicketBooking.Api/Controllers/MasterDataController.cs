using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScenicTicketBooking.Domain.Entities;
using ScenicTicketBooking.Domain.Interfaces;

namespace ScenicTicketBooking.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class ScenicSpotsController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;

    public ScenicSpotsController(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ScenicSpot>>> GetAll(CancellationToken cancellationToken)
    {
        var result = await (_unitOfWork.ScenicSpots as IQueryable<ScenicSpot>)!
            .Where(s => s.IsActive)
            .OrderBy(s => s.Name)
            .ToListAsync(cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ScenicSpot>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _unitOfWork.ScenicSpots.GetByIdAsync(id, cancellationToken);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<ScenicSpot>> Create([FromBody] ScenicSpot dto, CancellationToken cancellationToken)
    {
        dto.Id = Guid.NewGuid();
        dto.CreatedAt = DateTime.UtcNow;
        dto.IsActive = true;
        var result = await _unitOfWork.ScenicSpots.AddAsync(dto, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] ScenicSpot dto, CancellationToken cancellationToken)
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
        return NoContent();
    }
}

[ApiController]
[Route("api/scenicspots/{scenicSpotId:guid}/timeslots")]
[Produces("application/json")]
public class TimeSlotsController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;

    public TimeSlotsController(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TimeSlot>>> GetByScenicSpot(
        Guid scenicSpotId,
        [FromQuery] DateOnly? startDate,
        [FromQuery] DateOnly? endDate,
        CancellationToken cancellationToken)
    {
        var query = (_unitOfWork.TimeSlots as IQueryable<TimeSlot>)!
            .Where(t => t.ScenicSpotId == scenicSpotId && t.IsActive);

        if (startDate.HasValue)
            query = query.Where(t => t.Date >= startDate.Value);
        if (endDate.HasValue)
            query = query.Where(t => t.Date <= endDate.Value);

        var result = await query
            .OrderBy(t => t.Date)
            .ThenBy(t => t.StartTime)
            .ToListAsync(cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TimeSlot>> GetById(Guid scenicSpotId, Guid id, CancellationToken cancellationToken)
    {
        var result = await _unitOfWork.TimeSlots.GetByIdAsync(id, cancellationToken);
        if (result == null || result.ScenicSpotId != scenicSpotId) return NotFound();
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<TimeSlot>> Create(
        Guid scenicSpotId,
        [FromBody] TimeSlot dto,
        CancellationToken cancellationToken)
    {
        dto.Id = Guid.NewGuid();
        dto.ScenicSpotId = scenicSpotId;
        dto.CreatedAt = DateTime.UtcNow;
        dto.IsActive = true;
        var result = await _unitOfWork.TimeSlots.AddAsync(dto, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(GetById), new { scenicSpotId, id = result.Id }, result);
    }

    [HttpPost("bulk")]
    public async Task<ActionResult<IEnumerable<TimeSlot>>> BulkCreate(
        Guid scenicSpotId,
        [FromBody] BulkTimeSlotCreateDto dto,
        CancellationToken cancellationToken)
    {
        var created = new List<TimeSlot>();
        for (var date = dto.StartDate; date <= dto.EndDate; date = date.AddDays(1))
        {
            foreach (var slot in dto.TimeRanges)
            {
                var entity = new TimeSlot
                {
                    Id = Guid.NewGuid(),
                    ScenicSpotId = scenicSpotId,
                    Date = date,
                    StartTime = slot.StartTime,
                    EndTime = slot.EndTime,
                    Capacity = dto.Capacity,
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
}

public class BulkTimeSlotCreateDto
{
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public int Capacity { get; set; } = 100;
    public List<TimeRangeDto> TimeRanges { get; set; } = new();
}

public class TimeRangeDto
{
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
}

[ApiController]
[Route("api/scenicspots/{scenicSpotId:guid}/tickettypes")]
[Produces("application/json")]
public class TicketTypesController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;

    public TicketTypesController(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TicketType>>> GetByScenicSpot(Guid scenicSpotId, CancellationToken cancellationToken)
    {
        var result = await (_unitOfWork.TicketTypes as IQueryable<TicketType>)!
            .Where(t => t.ScenicSpotId == scenicSpotId && t.IsActive)
            .OrderBy(t => t.SortOrder)
            .ThenBy(t => t.Name)
            .ToListAsync(cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<TicketType>> Create(
        Guid scenicSpotId,
        [FromBody] TicketType dto,
        CancellationToken cancellationToken)
    {
        dto.Id = Guid.NewGuid();
        dto.ScenicSpotId = scenicSpotId;
        dto.CreatedAt = DateTime.UtcNow;
        dto.IsActive = true;
        var result = await _unitOfWork.TicketTypes.AddAsync(dto, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(GetByScenicSpot), new { scenicSpotId }, result);
    }
}

[ApiController]
[Route("api/visitors")]
[Produces("application/json")]
public class VisitorsController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;

    public VisitorsController(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Visitor>>> Search(
        [FromQuery] string? keyword,
        CancellationToken cancellationToken)
    {
        var query = (_unitOfWork.Visitors as IQueryable<Visitor>)!;
        if (!string.IsNullOrWhiteSpace(keyword))
        {
            query = query.Where(v =>
                v.Name.Contains(keyword) ||
                v.IdCardNumber.Contains(keyword) ||
                (v.PhoneNumber != null && v.PhoneNumber.Contains(keyword)));
        }
        var result = await query
            .OrderByDescending(v => v.CreatedAt)
            .Take(100)
            .ToListAsync(cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Visitor>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _unitOfWork.Visitors.GetByIdAsync(id, cancellationToken);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<Visitor>> CreateOrUpdate([FromBody] Visitor dto, CancellationToken cancellationToken)
    {
        var existing = await (_unitOfWork.Visitors as IQueryable<Visitor>)!
            .FirstOrDefaultAsync(v => v.IdCardNumber == dto.IdCardNumber, cancellationToken);

        if (existing != null)
        {
            existing.Name = dto.Name;
            existing.PhoneNumber = dto.PhoneNumber;
            existing.Email = dto.Email;
            existing.Gender = dto.Gender;
            existing.Age = dto.Age;
            existing.Remarks = dto.Remarks;
            existing.UpdatedAt = DateTime.UtcNow;
            _unitOfWork.Visitors.Update(existing);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return Ok(existing);
        }

        dto.Id = Guid.NewGuid();
        dto.CreatedAt = DateTime.UtcNow;
        var result = await _unitOfWork.Visitors.AddAsync(dto, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }
}
