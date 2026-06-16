using ElderCareScheduling.API.Data;
using ElderCareScheduling.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace ElderCareScheduling.API.Repositories;

public class MedicationRepository : IMedicationRepository
{
    private readonly ApplicationDbContext _context;

    public MedicationRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Medication?> GetByIdAsync(Guid id)
    {
        return await _context.Set<Medication>().FindAsync(id);
    }

    public async Task<IEnumerable<Medication>> GetAllAsync()
    {
        return await _context.Set<Medication>().ToListAsync();
    }

    public async Task<IEnumerable<Medication>> FindAsync(System.Linq.Expressions.Expression<Func<Medication, bool>> predicate)
    {
        return await _context.Set<Medication>().Where(predicate).ToListAsync();
    }

    public async Task<Medication?> FirstOrDefaultAsync(System.Linq.Expressions.Expression<Func<Medication, bool>> predicate)
    {
        return await _context.Set<Medication>().FirstOrDefaultAsync(predicate);
    }

    public async Task AddAsync(Medication entity)
    {
        await _context.Set<Medication>().AddAsync(entity);
    }

    public async Task AddRangeAsync(IEnumerable<Medication> entities)
    {
        await _context.Set<Medication>().AddRangeAsync(entities);
    }

    public void Update(Medication entity)
    {
        _context.Set<Medication>().Update(entity);
    }

    public void Remove(Medication entity)
    {
        _context.Set<Medication>().Remove(entity);
    }

    public void RemoveRange(IEnumerable<Medication> entities)
    {
        _context.Set<Medication>().RemoveRange(entities);
    }

    public async Task<bool> ExistsAsync(System.Linq.Expressions.Expression<Func<Medication, bool>> predicate)
    {
        return await _context.Set<Medication>().AnyAsync(predicate);
    }

    public async Task<int> CountAsync(System.Linq.Expressions.Expression<Func<Medication, bool>>? predicate = null)
    {
        return predicate == null
            ? await _context.Set<Medication>().CountAsync()
            : await _context.Set<Medication>().CountAsync(predicate);
    }

    public async Task<IEnumerable<Medication>> GetByElderIdAsync(Guid elderId)
    {
        return await _context.Set<Medication>()
            .Where(m => m.ElderId == elderId)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync();
    }
}
