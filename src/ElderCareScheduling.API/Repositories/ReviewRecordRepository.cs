using ElderCareScheduling.API.Data;
using ElderCareScheduling.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace ElderCareScheduling.API.Repositories;

public class ReviewRecordRepository : IReviewRecordRepository
{
    private readonly ApplicationDbContext _context;

    public ReviewRecordRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ReviewRecord?> GetByIdAsync(Guid id)
    {
        return await _context.Set<ReviewRecord>().FindAsync(id);
    }

    public async Task<IEnumerable<ReviewRecord>> GetAllAsync()
    {
        return await _context.Set<ReviewRecord>().ToListAsync();
    }

    public async Task<IEnumerable<ReviewRecord>> FindAsync(System.Linq.Expressions.Expression<Func<ReviewRecord, bool>> predicate)
    {
        return await _context.Set<ReviewRecord>().Where(predicate).ToListAsync();
    }

    public async Task<ReviewRecord?> FirstOrDefaultAsync(System.Linq.Expressions.Expression<Func<ReviewRecord, bool>> predicate)
    {
        return await _context.Set<ReviewRecord>().FirstOrDefaultAsync(predicate);
    }

    public async Task AddAsync(ReviewRecord entity)
    {
        await _context.Set<ReviewRecord>().AddAsync(entity);
    }

    public async Task AddRangeAsync(IEnumerable<ReviewRecord> entities)
    {
        await _context.Set<ReviewRecord>().AddRangeAsync(entities);
    }

    public void Update(ReviewRecord entity)
    {
        _context.Set<ReviewRecord>().Update(entity);
    }

    public void Remove(ReviewRecord entity)
    {
        _context.Set<ReviewRecord>().Remove(entity);
    }

    public void RemoveRange(IEnumerable<ReviewRecord> entities)
    {
        _context.Set<ReviewRecord>().RemoveRange(entities);
    }

    public async Task<bool> ExistsAsync(System.Linq.Expressions.Expression<Func<ReviewRecord, bool>> predicate)
    {
        return await _context.Set<ReviewRecord>().AnyAsync(predicate);
    }

    public async Task<int> CountAsync(System.Linq.Expressions.Expression<Func<ReviewRecord, bool>>? predicate = null)
    {
        return predicate == null
            ? await _context.Set<ReviewRecord>().CountAsync()
            : await _context.Set<ReviewRecord>().CountAsync(predicate);
    }

    public async Task<IEnumerable<ReviewRecord>> GetByScheduleIdAsync(Guid scheduleId)
    {
        return await _context.Set<ReviewRecord>()
            .Where(r => r.ScheduleId == scheduleId)
            .OrderByDescending(r => r.ReviewedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<ReviewRecord>> GetByExceptionIdAsync(Guid exceptionId)
    {
        return await _context.Set<ReviewRecord>()
            .Where(r => r.ExceptionRecordId == exceptionId)
            .OrderByDescending(r => r.ReviewedAt)
            .ToListAsync();
    }
}
