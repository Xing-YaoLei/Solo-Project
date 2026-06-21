using Microsoft.EntityFrameworkCore;
using TicketDesk.Infrastructure.Data;

namespace TicketDesk.Infrastructure.Repositories;

public class Repository : IRepository
{
    private readonly TicketDeskDbContext _context;

    public Repository(TicketDeskDbContext context)
    {
        _context = context;
    }

    public async Task<T?> GetByIdAsync<T>(Guid id) where T : class
    {
        return await _context.Set<T>().FindAsync(id);
    }

    public async Task<IReadOnlyList<T>> ListAsync<T>() where T : class
    {
        return await _context.Set<T>().ToListAsync();
    }

    public async Task AddAsync<T>(T entity) where T : class
    {
        await _context.Set<T>().AddAsync(entity);
    }

    public Task UpdateAsync<T>(T entity) where T : class
    {
        _context.Set<T>().Update(entity);
        return Task.CompletedTask;
    }

    public Task DeleteAsync<T>(T entity) where T : class
    {
        _context.Set<T>().Remove(entity);
        return Task.CompletedTask;
    }
}
