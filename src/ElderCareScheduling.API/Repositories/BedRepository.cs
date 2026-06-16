using ElderCareScheduling.API.Data;
using ElderCareScheduling.API.Enums;
using ElderCareScheduling.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace ElderCareScheduling.API.Repositories;

public class BedRepository : IBedRepository
{
    private readonly ApplicationDbContext _context;

    public BedRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Bed?> GetByIdAsync(Guid id)
    {
        return await _context.Set<Bed>().FindAsync(id);
    }

    public async Task<IEnumerable<Bed>> GetAllAsync()
    {
        return await _context.Set<Bed>().ToListAsync();
    }

    public async Task<IEnumerable<Bed>> FindAsync(System.Linq.Expressions.Expression<Func<Bed, bool>> predicate)
    {
        return await _context.Set<Bed>().Where(predicate).ToListAsync();
    }

    public async Task<Bed?> FirstOrDefaultAsync(System.Linq.Expressions.Expression<Func<Bed, bool>> predicate)
    {
        return await _context.Set<Bed>().FirstOrDefaultAsync(predicate);
    }

    public async Task AddAsync(Bed entity)
    {
        await _context.Set<Bed>().AddAsync(entity);
    }

    public async Task AddRangeAsync(IEnumerable<Bed> entities)
    {
        await _context.Set<Bed>().AddRangeAsync(entities);
    }

    public void Update(Bed entity)
    {
        _context.Set<Bed>().Update(entity);
    }

    public void Remove(Bed entity)
    {
        _context.Set<Bed>().Remove(entity);
    }

    public void RemoveRange(IEnumerable<Bed> entities)
    {
        _context.Set<Bed>().RemoveRange(entities);
    }

    public async Task<bool> ExistsAsync(System.Linq.Expressions.Expression<Func<Bed, bool>> predicate)
    {
        return await _context.Set<Bed>().AnyAsync(predicate);
    }

    public async Task<int> CountAsync(System.Linq.Expressions.Expression<Func<Bed, bool>>? predicate = null)
    {
        return predicate == null
            ? await _context.Set<Bed>().CountAsync()
            : await _context.Set<Bed>().CountAsync(predicate);
    }

    public async Task<IEnumerable<Bed>> GetAvailableBedsAsync()
    {
        return await _context.Set<Bed>()
            .Where(b => b.Status == BedStatus.Available && b.IsActive)
            .OrderBy(b => b.BedNumber)
            .ToListAsync();
    }
}
