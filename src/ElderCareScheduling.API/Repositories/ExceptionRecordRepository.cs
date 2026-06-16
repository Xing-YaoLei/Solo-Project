using ElderCareScheduling.API.Data;
using ElderCareScheduling.API.Enums;
using ElderCareScheduling.API.Models.DTOs;
using ElderCareScheduling.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace ElderCareScheduling.API.Repositories;

public class ExceptionRecordRepository : IExceptionRecordRepository
{
    private readonly ApplicationDbContext _context;

    public ExceptionRecordRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ExceptionRecord?> GetByIdAsync(Guid id)
    {
        return await _context.Set<ExceptionRecord>().FindAsync(id);
    }

    public async Task<IEnumerable<ExceptionRecord>> GetAllAsync()
    {
        return await _context.Set<ExceptionRecord>().ToListAsync();
    }

    public async Task<IEnumerable<ExceptionRecord>> FindAsync(System.Linq.Expressions.Expression<Func<ExceptionRecord, bool>> predicate)
    {
        return await _context.Set<ExceptionRecord>().Where(predicate).ToListAsync();
    }

    public async Task<ExceptionRecord?> FirstOrDefaultAsync(System.Linq.Expressions.Expression<Func<ExceptionRecord, bool>> predicate)
    {
        return await _context.Set<ExceptionRecord>().FirstOrDefaultAsync(predicate);
    }

    public async Task AddAsync(ExceptionRecord entity)
    {
        await _context.Set<ExceptionRecord>().AddAsync(entity);
    }

    public async Task AddRangeAsync(IEnumerable<ExceptionRecord> entities)
    {
        await _context.Set<ExceptionRecord>().AddRangeAsync(entities);
    }

    public void Update(ExceptionRecord entity)
    {
        _context.Set<ExceptionRecord>().Update(entity);
    }

    public void Remove(ExceptionRecord entity)
    {
        _context.Set<ExceptionRecord>().Remove(entity);
    }

    public void RemoveRange(IEnumerable<ExceptionRecord> entities)
    {
        _context.Set<ExceptionRecord>().RemoveRange(entities);
    }

    public async Task<bool> ExistsAsync(System.Linq.Expressions.Expression<Func<ExceptionRecord, bool>> predicate)
    {
        return await _context.Set<ExceptionRecord>().AnyAsync(predicate);
    }

    public async Task<int> CountAsync(System.Linq.Expressions.Expression<Func<ExceptionRecord, bool>>? predicate = null)
    {
        return predicate == null
            ? await _context.Set<ExceptionRecord>().CountAsync()
            : await _context.Set<ExceptionRecord>().CountAsync(predicate);
    }

    public async Task<ExceptionRecord?> GetWithFullDetailsAsync(Guid id)
    {
        return await _context.Set<ExceptionRecord>()
            .Include(e => e.Elder)
            .Include(e => e.Schedule)
            .Include(e => e.ReviewRecords)
            .Include(e => e.Attachments)
            .Include(e => e.StatusHistories)
                .ThenInclude(h => h.ExceptionRecord)
            .FirstOrDefaultAsync(e => e.Id == id);
    }

    public async Task<PagedResultDto<ExceptionRecordListDto>> GetPagedListAsync(ExceptionQueryDto query)
    {
        var queryable = _context.Set<ExceptionRecord>().AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Keyword))
        {
            queryable = queryable.Where(e =>
                e.ExceptionNo.Contains(query.Keyword) ||
                e.Description.Contains(query.Keyword) ||
                (e.Elder != null && e.Elder.Name.Contains(query.Keyword)));
        }

        if (query.ExceptionType.HasValue)
        {
            queryable = queryable.Where(e => e.ExceptionType == query.ExceptionType.Value);
        }

        if (query.Severity.HasValue)
        {
            queryable = queryable.Where(e => e.Severity == query.Severity.Value);
        }

        if (query.Status.HasValue)
        {
            queryable = queryable.Where(e => e.Status == query.Status.Value);
        }

        if (query.CloseType.HasValue)
        {
            queryable = queryable.Where(e => e.CloseType == query.CloseType.Value);
        }

        if (query.ElderId.HasValue)
        {
            queryable = queryable.Where(e => e.ElderId == query.ElderId.Value);
        }

        if (query.ScheduleId.HasValue)
        {
            queryable = queryable.Where(e => e.ScheduleId == query.ScheduleId.Value);
        }

        if (query.OccurredFrom.HasValue)
        {
            queryable = queryable.Where(e => e.OccurredAt >= query.OccurredFrom.Value);
        }

        if (query.OccurredTo.HasValue)
        {
            queryable = queryable.Where(e => e.OccurredAt <= query.OccurredTo.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.AssignedTo))
        {
            queryable = queryable.Where(e => e.AssignedTo != null && e.AssignedTo.Contains(query.AssignedTo));
        }

        if (!query.IncludeClosed.GetValueOrDefault(true))
        {
            queryable = queryable.Where(e =>
                e.Status != ExceptionStatus.ClosedNormal &&
                e.Status != ExceptionStatus.ClosedWithSupplement &&
                e.Status != ExceptionStatus.ClosedEscalated);
        }

        var totalCount = await queryable.CountAsync();

        var items = await queryable
            .Include(e => e.Elder)
            .Include(e => e.Schedule)
            .OrderByDescending(e => e.CreatedAt)
            .Skip((query.PageIndex - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(e => new ExceptionRecordListDto
            {
                Id = e.Id,
                ExceptionNo = e.ExceptionNo,
                ScheduleId = e.ScheduleId,
                ScheduleNo = e.Schedule != null ? e.Schedule.ScheduleNo : null,
                ElderId = e.ElderId,
                ElderName = e.Elder != null ? e.Elder.Name : string.Empty,
                ExceptionType = e.ExceptionType,
                ExceptionTypeText = e.ExceptionType.ToString(),
                Severity = e.Severity,
                SeverityText = e.Severity.ToString(),
                Status = e.Status,
                StatusText = e.Status.ToString(),
                CloseType = e.CloseType,
                CloseTypeText = e.CloseType.HasValue ? e.CloseType.Value.ToString() : null,
                OccurredAt = e.OccurredAt,
                OccurredLocation = e.OccurredLocation,
                Description = e.Description,
                AssignedTo = e.AssignedTo,
                CreatedAt = e.CreatedAt,
                CreatedBy = e.CreatedBy,
                ClosedAt = e.ClosedAt,
                ClosedBy = e.ClosedBy
            })
            .ToListAsync();

        return new PagedResultDto<ExceptionRecordListDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageIndex = query.PageIndex,
            PageSize = query.PageSize
        };
    }

    public async Task<IEnumerable<ExceptionRecord>> GetByScheduleIdAsync(Guid scheduleId)
    {
        return await _context.Set<ExceptionRecord>()
            .Where(e => e.ScheduleId == scheduleId)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<ExceptionRecord>> GetByElderIdAsync(Guid elderId)
    {
        return await _context.Set<ExceptionRecord>()
            .Where(e => e.ElderId == elderId)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync();
    }

    public async Task<string> GenerateExceptionNoAsync()
    {
        var datePart = DateTime.Now.ToString("yyyyMMdd");
        var prefix = $"EXC-{datePart}-";
        var lastException = await _context.Set<ExceptionRecord>()
            .Where(e => e.ExceptionNo.StartsWith(prefix))
            .OrderByDescending(e => e.ExceptionNo)
            .FirstOrDefaultAsync();

        var sequence = 1;
        if (lastException != null && !string.IsNullOrEmpty(lastException.ExceptionNo))
        {
            var lastPart = lastException.ExceptionNo.Substring(prefix.Length);
            if (int.TryParse(lastPart, out var lastSeq))
            {
                sequence = lastSeq + 1;
            }
        }

        return $"{prefix}{sequence:0000}";
    }

    public async Task AddStatusHistoryAsync(ExceptionStatusHistory history)
    {
        await _context.Set<ExceptionStatusHistory>().AddAsync(history);
    }

    public async Task AddAttachmentAsync(ExceptionAttachment attachment)
    {
        await _context.Set<ExceptionAttachment>().AddAsync(attachment);
    }
}
