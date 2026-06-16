using ElderCareScheduling.API.Data;
using ElderCareScheduling.API.Enums;
using ElderCareScheduling.API.Models.DTOs;
using ElderCareScheduling.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace ElderCareScheduling.API.Repositories;

public class ScheduleRepository : IScheduleRepository
{
    private readonly ApplicationDbContext _context;

    public ScheduleRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<CareSchedule?> GetByIdAsync(Guid id)
    {
        return await _context.Set<CareSchedule>().FindAsync(id);
    }

    public async Task<IEnumerable<CareSchedule>> GetAllAsync()
    {
        return await _context.Set<CareSchedule>().ToListAsync();
    }

    public async Task<IEnumerable<CareSchedule>> FindAsync(System.Linq.Expressions.Expression<Func<CareSchedule, bool>> predicate)
    {
        return await _context.Set<CareSchedule>().Where(predicate).ToListAsync();
    }

    public async Task<CareSchedule?> FirstOrDefaultAsync(System.Linq.Expressions.Expression<Func<CareSchedule, bool>> predicate)
    {
        return await _context.Set<CareSchedule>().FirstOrDefaultAsync(predicate);
    }

    public async Task AddAsync(CareSchedule entity)
    {
        await _context.Set<CareSchedule>().AddAsync(entity);
    }

    public async Task AddRangeAsync(IEnumerable<CareSchedule> entities)
    {
        await _context.Set<CareSchedule>().AddRangeAsync(entities);
    }

    public void Update(CareSchedule entity)
    {
        _context.Set<CareSchedule>().Update(entity);
    }

    public void Remove(CareSchedule entity)
    {
        _context.Set<CareSchedule>().Remove(entity);
    }

    public void RemoveRange(IEnumerable<CareSchedule> entities)
    {
        _context.Set<CareSchedule>().RemoveRange(entities);
    }

    public async Task<bool> ExistsAsync(System.Linq.Expressions.Expression<Func<CareSchedule, bool>> predicate)
    {
        return await _context.Set<CareSchedule>().AnyAsync(predicate);
    }

    public async Task<int> CountAsync(System.Linq.Expressions.Expression<Func<CareSchedule, bool>>? predicate = null)
    {
        return predicate == null
            ? await _context.Set<CareSchedule>().CountAsync()
            : await _context.Set<CareSchedule>().CountAsync(predicate);
    }

    public async Task<CareSchedule?> GetWithFullDetailsAsync(Guid id)
    {
        return await _context.Set<CareSchedule>()
            .Include(s => s.Elder)
                .ThenInclude(e => e!.CareLevel)
            .Include(s => s.Elder)
                .ThenInclude(e => e!.Medications)
            .Include(s => s.CareLevel)
            .Include(s => s.Bed)
            .Include(s => s.ReviewRecords)
            .Include(s => s.ExceptionRecords)
            .Include(s => s.StatusHistories)
                .ThenInclude(h => h.Schedule)
            .FirstOrDefaultAsync(s => s.Id == id);
    }

    public async Task<PagedResultDto<ScheduleListDto>> GetPagedListAsync(ScheduleQueryDto query)
    {
        var queryable = _context.Set<CareSchedule>().AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Keyword))
        {
            queryable = queryable.Where(s =>
                s.ScheduleNo.Contains(query.Keyword) ||
                (s.Elder != null && s.Elder.Name.Contains(query.Keyword)));
        }

        if (query.Status.HasValue)
        {
            queryable = queryable.Where(s => s.Status == query.Status.Value);
        }

        if (query.ElderId.HasValue)
        {
            queryable = queryable.Where(s => s.ElderId == query.ElderId.Value);
        }

        if (query.CareLevelId.HasValue)
        {
            queryable = queryable.Where(s => s.CareLevelId == query.CareLevelId.Value);
        }

        if (query.StartDateFrom.HasValue)
        {
            queryable = queryable.Where(s => s.StartDate >= query.StartDateFrom.Value);
        }

        if (query.StartDateTo.HasValue)
        {
            queryable = queryable.Where(s => s.StartDate <= query.StartDateTo.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.PrimaryNurse))
        {
            queryable = queryable.Where(s => s.PrimaryNurse != null && s.PrimaryNurse.Contains(query.PrimaryNurse));
        }

        if (query.HasExceptions.HasValue)
        {
            queryable = query.HasExceptions.Value
                ? queryable.Where(s => s.ExceptionRecords.Any())
                : queryable.Where(s => !s.ExceptionRecords.Any());
        }

        if (query.CareStandard.HasValue)
        {
            queryable = queryable.Where(s => s.CareStandard == query.CareStandard.Value);
        }

        var totalCount = await queryable.CountAsync();

        var items = await queryable
            .Include(s => s.Elder)
            .Include(s => s.CareLevel)
            .Include(s => s.Bed)
            .Include(s => s.ExceptionRecords)
            .OrderByDescending(s => s.CreatedAt)
            .Skip((query.PageIndex - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(s => new ScheduleListDto
            {
                Id = s.Id,
                ScheduleNo = s.ScheduleNo,
                ElderId = s.ElderId,
                ElderName = s.Elder != null ? s.Elder.Name : string.Empty,
                ElderAge = s.Elder != null ? s.Elder.Age : 0,
                CareLevelName = s.CareLevel != null ? s.CareLevel.LevelName : null,
                BedNumber = s.Bed != null ? s.Bed.BedNumber : null,
                StartDate = s.StartDate,
                EndDate = s.EndDate,
                ShiftType = s.ShiftType,
                PrimaryNurse = s.PrimaryNurse,
                Status = s.Status,
                StatusText = s.Status.ToString(),
                CareStandard = s.CareStandard,
                CreatedAt = s.CreatedAt,
                CreatedBy = s.CreatedBy,
                HasExceptions = s.ExceptionRecords.Any(),
                ExceptionCount = s.ExceptionRecords.Count
            })
            .ToListAsync();

        return new PagedResultDto<ScheduleListDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageIndex = query.PageIndex,
            PageSize = query.PageSize
        };
    }

    public async Task<IEnumerable<CareSchedule>> GetByElderIdAsync(Guid elderId)
    {
        return await _context.Set<CareSchedule>()
            .Where(s => s.ElderId == elderId)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<CareSchedule>> GetByBedIdAsync(Guid bedId, bool includeClosed = false)
    {
        var queryable = _context.Set<CareSchedule>()
            .Where(s => s.BedId == bedId);

        if (!includeClosed)
        {
            queryable = queryable.Where(s => s.Status != ScheduleStatus.Closed && s.Status != ScheduleStatus.Archived);
        }

        return await queryable
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<CareSchedule>> GetByStatusAsync(ScheduleStatus status)
    {
        return await _context.Set<CareSchedule>()
            .Where(s => s.Status == status)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();
    }

    public async Task<string> GenerateScheduleNoAsync()
    {
        var datePart = DateTime.Now.ToString("yyyyMMdd");
        var prefix = $"SCH-{datePart}-";
        var lastSchedule = await _context.Set<CareSchedule>()
            .Where(s => s.ScheduleNo.StartsWith(prefix))
            .OrderByDescending(s => s.ScheduleNo)
            .FirstOrDefaultAsync();

        var sequence = 1;
        if (lastSchedule != null && !string.IsNullOrEmpty(lastSchedule.ScheduleNo))
        {
            var lastPart = lastSchedule.ScheduleNo.Substring(prefix.Length);
            if (int.TryParse(lastPart, out var lastSeq))
            {
                sequence = lastSeq + 1;
            }
        }

        return $"{prefix}{sequence:0000}";
    }
}
