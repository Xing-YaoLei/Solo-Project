using ElderCareScheduling.API.Data;
using ElderCareScheduling.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace ElderCareScheduling.API.Repositories;

public class CareLevelRepository : ICareLevelRepository
{
    private readonly ApplicationDbContext _context;

    public CareLevelRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<CareLevel?> GetByIdAsync(Guid id)
    {
        return await _context.Set<CareLevel>().FindAsync(id);
    }

    public async Task<IEnumerable<CareLevel>> GetAllAsync()
    {
        return await _context.Set<CareLevel>().ToListAsync();
    }

    public async Task<IEnumerable<CareLevel>> FindAsync(System.Linq.Expressions.Expression<Func<CareLevel, bool>> predicate)
    {
        return await _context.Set<CareLevel>().Where(predicate).ToListAsync();
    }

    public async Task<CareLevel?> FirstOrDefaultAsync(System.Linq.Expressions.Expression<Func<CareLevel, bool>> predicate)
    {
        return await _context.Set<CareLevel>().FirstOrDefaultAsync(predicate);
    }

    public async Task AddAsync(CareLevel entity)
    {
        await _context.Set<CareLevel>().AddAsync(entity);
    }

    public async Task AddRangeAsync(IEnumerable<CareLevel> entities)
    {
        await _context.Set<CareLevel>().AddRangeAsync(entities);
    }

    public void Update(CareLevel entity)
    {
        _context.Set<CareLevel>().Update(entity);
    }

    public void Remove(CareLevel entity)
    {
        _context.Set<CareLevel>().Remove(entity);
    }

    public void RemoveRange(IEnumerable<CareLevel> entities)
    {
        _context.Set<CareLevel>().RemoveRange(entities);
    }

    public async Task<bool> ExistsAsync(System.Linq.Expressions.Expression<Func<CareLevel, bool>> predicate)
    {
        return await _context.Set<CareLevel>().AnyAsync(predicate);
    }

    public async Task<int> CountAsync(System.Linq.Expressions.Expression<Func<CareLevel, bool>>? predicate = null)
    {
        return predicate == null
            ? await _context.Set<CareLevel>().CountAsync()
            : await _context.Set<CareLevel>().CountAsync(predicate);
    }
}
