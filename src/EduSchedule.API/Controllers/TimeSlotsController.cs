using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using EduSchedule.API.Data;
using EduSchedule.API.Models;

namespace EduSchedule.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TimeSlotsController : ControllerBase
{
    private readonly AppDbContext _context;

    public TimeSlotsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TimeSlot>>> GetTimeSlots(CancellationToken cancellationToken)
    {
        var slots = await _context.TimeSlots
            .OrderBy(t => t.DisplayOrder)
            .ThenBy(t => t.StartTime)
            .ToListAsync(cancellationToken);
        return Ok(slots);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TimeSlot>> GetTimeSlot(int id, CancellationToken cancellationToken)
    {
        var slot = await _context.TimeSlots.FindAsync(new object[] { id }, cancellationToken);
        if (slot == null) return NotFound();
        return Ok(slot);
    }

    [HttpPost]
    [Authorize(Roles = "Administrator,AcademicAffairs")]
    public async Task<ActionResult<TimeSlot>>> PostTimeSlot(TimeSlot slot, CancellationToken cancellationToken)
    {
        slot.CreatedAt = DateTime.UtcNow;
        _context.TimeSlots.Add(slot);
        await _context.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetTimeSlot), new { id = slot.Id }, slot);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrator,AcademicAffairs")]
    public async Task<IActionResult> PutTimeSlot(int id, TimeSlot slot, CancellationToken cancellationToken)
    {
        if (id != slot.Id) return BadRequest();

        var existing = await _context.TimeSlots.FindAsync(new object[] { id }, cancellationToken);
        if (existing == null) return NotFound();

        existing.Name = slot.Name;
        existing.PeriodNumber = slot.PeriodNumber;
        existing.StartTime = slot.StartTime;
        existing.EndTime = slot.EndTime;
        existing.Description = slot.Description;
        existing.DisplayOrder = slot.DisplayOrder;
        existing.IsActive = slot.IsActive;

        await _context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrator,AcademicAffairs")]
    public async Task<IActionResult> DeleteTimeSlot(int id, CancellationToken cancellationToken)
    {
        var slot = await _context.TimeSlots.FindAsync(new object[] { id }, cancellationToken);
        if (slot == null) return NotFound();

        var hasSchedules = await _context.CourseSchedules.AnyAsync(s => s.TimeSlotId == id, cancellationToken);
        if (hasSchedules)
        {
            return BadRequest(new { message = "该时段已有排课，无法删除" });
        }

        _context.TimeSlots.Remove(slot);
        await _context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }
}
