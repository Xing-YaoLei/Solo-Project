using CourierVerification.Data;
using CourierVerification.DTOs;
using CourierVerification.Enums;
using CourierVerification.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CourierVerification.Controllers;

[ApiController]
[Route("api/riders")]
public class RidersController : ControllerBase
{
    private readonly AppDbContext _context;

    public RidersController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetList(
        string? keyword,
        RiderStatus? status,
        int page = 1,
        int pageSize = 20)
    {
        try
        {
            var query = _context.Riders.AsQueryable();

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                query = query.Where(r =>
                    r.Name.Contains(keyword) ||
                    r.Phone.Contains(keyword) ||
                    (r.EmployeeNo != null && r.EmployeeNo.Contains(keyword)));
            }

            if (status.HasValue)
                query = query.Where(r => r.Status == status.Value);

            query = query.OrderByDescending(r => r.CreatedAt);

            var totalCount = await query.CountAsync();
            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(new PagedResult<Rider>
            {
                Items = items,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"内部服务器错误: {ex.Message}");
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        try
        {
            var rider = await _context.Riders
                .Include(r => r.Orders)
                .Include(r => r.VerificationRecords)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (rider == null)
                return NotFound("骑手不存在");

            return Ok(rider);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"内部服务器错误: {ex.Message}");
        }
    }

    [HttpGet("activity-analysis")]
    public async Task<IActionResult> GetActivityAnalysis(DateTime? startDate, DateTime? endDate)
    {
        try
        {
            var query = _context.VerificationRecords.AsQueryable();

            if (startDate.HasValue)
                query = query.Where(v => v.CreatedAt >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(v => v.CreatedAt <= endDate.Value);

            var activities = await query
                .Where(v => v.RiderId.HasValue)
                .GroupBy(v => v.RiderId!.Value)
                .Select(g => new
                {
                    RiderId = g.Key,
                    VerificationCount = g.Count(),
                    DamageCount = g.Count(v => v.Status == VerificationStatus.Damaged)
                })
                .ToListAsync();

            var riderIds = activities.Select(a => a.RiderId).ToList();
            var riders = await _context.Riders
                .Where(r => riderIds.Contains(r.Id))
                .ToDictionaryAsync(r => r.Id, r => r);

            var result = activities.Select(a =>
            {
                var rider = riders.GetValueOrDefault(a.RiderId);
                return new RiderActivityDto
                {
                    RiderId = a.RiderId,
                    RiderName = rider?.Name ?? string.Empty,
                    Status = rider?.Status ?? RiderStatus.Offline,
                    TotalDeliveries = rider?.TotalDeliveries ?? 0,
                    TotalVerifications = a.VerificationCount,
                    DamageIncidents = a.DamageCount,
                    Rating = rider?.Rating ?? 0
                };
            }).ToList();

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"内部服务器错误: {ex.Message}");
        }
    }
}
