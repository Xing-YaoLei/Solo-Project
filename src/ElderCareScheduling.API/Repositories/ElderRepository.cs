using ElderCareScheduling.API.Data;
using ElderCareScheduling.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace ElderCareScheduling.API.Repositories;

public class ElderRepository : IElderRepository
{
    private readonly ApplicationDbContext _context;

    public ElderRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Elder?> GetByIdAsync(Guid id)
    {
        return await _context.Set<Elder>().FindAsync(id);
    }

    public async Task<IEnumerable<Elder>> GetAllAsync()
    {
        return await _context.Set<Elder>().ToListAsync();
    }

    public async Task<IEnumerable<Elder>> FindAsync(System.Linq.Expressions.Expression<Func<Elder, bool>> predicate)
    {
        return await _context.Set<Elder>().Where(predicate).ToListAsync();
    }

    public async Task<Elder?> FirstOrDefaultAsync(System.Linq.Expressions.Expression<Func<Elder, bool>> predicate)
    {
        return await _context.Set<Elder>().FirstOrDefaultAsync(predicate);
    }

    public async Task AddAsync(Elder entity)
    {
        await _context.Set<Elder>().AddAsync(entity);
    }

    public async Task AddRangeAsync(IEnumerable<Elder> entities)
    {
        await _context.Set<Elder>().AddRangeAsync(entities);
    }

    public void Update(Elder entity)
    {
        _context.Set<Elder>().Update(entity);
    }

    public void Remove(Elder entity)
    {
        _context.Set<Elder>().Remove(entity);
    }

    public void RemoveRange(IEnumerable<Elder> entities)
    {
        _context.Set<Elder>().RemoveRange(entities);
    }

    public async Task<bool> ExistsAsync(System.Linq.Expressions.Expression<Func<Elder, bool>> predicate)
    {
        return await _context.Set<Elder>().AnyAsync(predicate);
    }

    public async Task<int> CountAsync(System.Linq.Expressions.Expression<Func<Elder, bool>>? predicate = null)
    {
        return predicate == null
            ? await _context.Set<Elder>().CountAsync()
            : await _context.Set<Elder>().CountAsync(predicate);
    }

    public async Task<Elder?> GetWithDetailsAsync(Guid id)
    {
        return await _context.Set<Elder>()
            .Include(e => e.CareLevel)
            .Include(e => e.Medications)
            .FirstOrDefaultAsync(e => e.Id == id);
    }
}
