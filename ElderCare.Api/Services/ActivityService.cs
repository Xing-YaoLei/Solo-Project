using ElderCare.Api.Data;
using ElderCare.Api.DTOs;
using ElderCare.Api.Models;
using ElderCare.Api.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace ElderCare.Api.Services;

public class ActivityService : IActivityService
{
    private readonly AppDbContext _context;

    public ActivityService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<ThresholdDto>> GetAllThresholdsAsync()
    {
        return await _context.ActivityCheckInThresholds
            .Include(t => t.Area)
            .Select(t => new ThresholdDto
            {
                Id = t.Id,
                ActivityName = t.ActivityName,
                RequiredCheckIns = t.RequiredCheckIns,
                PeriodDays = t.PeriodDays,
                AreaId = t.AreaId,
                AreaName = t.Area != null ? t.Area.Name : null,
                IsActive = t.IsActive
            })
            .ToListAsync();
    }

    public async Task<ThresholdDto> CreateThresholdAsync(CreateThresholdDto dto)
    {
        var entity = new ActivityCheckInThreshold
        {
            ActivityName = dto.ActivityName,
            RequiredCheckIns = dto.RequiredCheckIns,
            PeriodDays = dto.PeriodDays,
            AreaId = dto.AreaId,
            IsActive = dto.IsActive
        };
        _context.ActivityCheckInThresholds.Add(entity);
        await _context.SaveChangesAsync();

        var result = await _context.ActivityCheckInThresholds
            .Include(t => t.Area)
            .FirstAsync(t => t.Id == entity.Id);

        return new ThresholdDto
        {
            Id = result.Id,
            ActivityName = result.ActivityName,
            RequiredCheckIns = result.RequiredCheckIns,
            PeriodDays = result.PeriodDays,
            AreaId = result.AreaId,
            AreaName = result.Area != null ? result.Area.Name : null,
            IsActive = result.IsActive
        };
    }

    public async Task<ThresholdDto?> UpdateThresholdAsync(int id, CreateThresholdDto dto)
    {
        var entity = await _context.ActivityCheckInThresholds.FindAsync(id);
        if (entity == null) return null;
        entity.ActivityName = dto.ActivityName;
        entity.RequiredCheckIns = dto.RequiredCheckIns;
        entity.PeriodDays = dto.PeriodDays;
        entity.AreaId = dto.AreaId;
        entity.IsActive = dto.IsActive;
        await _context.SaveChangesAsync();

        var result = await _context.ActivityCheckInThresholds
            .Include(t => t.Area)
            .FirstAsync(t => t.Id == id);

        return new ThresholdDto
        {
            Id = result.Id,
            ActivityName = result.ActivityName,
            RequiredCheckIns = result.RequiredCheckIns,
            PeriodDays = result.PeriodDays,
            AreaId = result.AreaId,
            AreaName = result.Area != null ? result.Area.Name : null,
            IsActive = result.IsActive
        };
    }

    public async Task<IEnumerable<CheckInDto>> GetAllCheckInsAsync()
    {
        return await _context.ActivityCheckIns
            .Include(c => c.Elderly)
            .Include(c => c.Staff)
            .Select(c => new CheckInDto
            {
                Id = c.Id,
                ElderlyId = c.ElderlyId,
                ElderlyName = c.Elderly.Name,
                ActivityName = c.ActivityName,
                StaffId = c.StaffId,
                StaffName = c.Staff.Name,
                CheckInTime = c.CheckInTime,
                Status = c.Status.ToString(),
                ThresholdId = c.ThresholdId,
                Notes = c.Notes
            })
            .ToListAsync();
    }

    public async Task<CheckInDto> CreateCheckInAsync(CreateCheckInDto dto)
    {
        var entity = new ActivityCheckIn
        {
            ElderlyId = dto.ElderlyId,
            ActivityName = dto.ActivityName,
            StaffId = dto.StaffId,
            CheckInTime = dto.CheckInTime,
            Status = dto.Status,
            ThresholdId = dto.ThresholdId,
            Notes = dto.Notes
        };
        _context.ActivityCheckIns.Add(entity);
        await _context.SaveChangesAsync();

        var result = await _context.ActivityCheckIns
            .Include(c => c.Elderly)
            .Include(c => c.Staff)
            .FirstAsync(c => c.Id == entity.Id);

        return new CheckInDto
        {
            Id = result.Id,
            ElderlyId = result.ElderlyId,
            ElderlyName = result.Elderly.Name,
            ActivityName = result.ActivityName,
            StaffId = result.StaffId,
            StaffName = result.Staff.Name,
            CheckInTime = result.CheckInTime,
            Status = result.Status.ToString(),
            ThresholdId = result.ThresholdId,
            Notes = result.Notes
        };
    }

    public async Task<IEnumerable<CheckInStatsDto>> GetCheckInStatsAsync(int? elderlyId = null, int? staffId = null)
    {
        var query = _context.ActivityCheckIns.AsQueryable();
        if (elderlyId.HasValue)
            query = query.Where(c => c.ElderlyId == elderlyId.Value);
        if (staffId.HasValue)
            query = query.Where(c => c.StaffId == staffId.Value);

        var checkIns = await query
            .Include(c => c.Elderly)
            .ToListAsync();

        var grouped = checkIns
            .GroupBy(c => new { c.ElderlyId, c.ActivityName, c.Elderly.Name })
            .Select(g => new CheckInStatsDto
            {
                ElderlyId = g.Key.ElderlyId,
                ElderlyName = g.Key.Name,
                ActivityName = g.Key.ActivityName,
                TotalCheckIns = g.Count(),
                CheckedIn = g.Count(c => c.Status == CheckInStatus.CheckedIn),
                Absent = g.Count(c => c.Status == CheckInStatus.Absent),
                Late = g.Count(c => c.Status == CheckInStatus.Late),
                Excused = g.Count(c => c.Status == CheckInStatus.Excused),
                IsCompliant = false
            })
            .ToList();

        foreach (var stat in grouped)
        {
            var threshold = await _context.ActivityCheckInThresholds
                .FirstOrDefaultAsync(t => t.ActivityName == stat.ActivityName && t.IsActive);
            if (threshold != null)
            {
                var periodStart = DateTime.UtcNow.AddDays(-threshold.PeriodDays);
                var recentCount = await _context.ActivityCheckIns
                    .CountAsync(c => c.ElderlyId == stat.ElderlyId && c.ActivityName == stat.ActivityName
                                     && c.CheckInTime >= periodStart && c.Status == CheckInStatus.CheckedIn);
                stat.IsCompliant = recentCount >= threshold.RequiredCheckIns;
            }
        }

        return grouped;
    }

    public async Task<IEnumerable<CheckInStatsDto>> CheckThresholdComplianceAsync(int? areaId = null)
    {
        var thresholds = await _context.ActivityCheckInThresholds
            .Where(t => t.IsActive)
            .ToListAsync();

        if (areaId.HasValue)
            thresholds = thresholds.Where(t => t.AreaId == null || t.AreaId == areaId.Value).ToList();

        var elderlyQuery = _context.ElderlyProfiles.AsQueryable();
        if (areaId.HasValue)
            elderlyQuery = elderlyQuery.Where(e => e.AreaId == areaId.Value);

        var elderlyList = await elderlyQuery.Select(e => new { e.Id, e.Name }).ToListAsync();
        var result = new List<CheckInStatsDto>();

        foreach (var elderly in elderlyList)
        {
            foreach (var threshold in thresholds)
            {
                var periodStart = DateTime.UtcNow.AddDays(-threshold.PeriodDays);
                var checkIns = await _context.ActivityCheckIns
                    .Where(c => c.ElderlyId == elderly.Id && c.ActivityName == threshold.ActivityName
                                && c.CheckInTime >= periodStart)
                    .ToListAsync();

                result.Add(new CheckInStatsDto
                {
                    ElderlyId = elderly.Id,
                    ElderlyName = elderly.Name,
                    ActivityName = threshold.ActivityName,
                    TotalCheckIns = checkIns.Count,
                    CheckedIn = checkIns.Count(c => c.Status == CheckInStatus.CheckedIn),
                    Absent = checkIns.Count(c => c.Status == CheckInStatus.Absent),
                    Late = checkIns.Count(c => c.Status == CheckInStatus.Late),
                    Excused = checkIns.Count(c => c.Status == CheckInStatus.Excused),
                    IsCompliant = checkIns.Count(c => c.Status == CheckInStatus.CheckedIn) >= threshold.RequiredCheckIns
                });
            }
        }

        return result;
    }
}
