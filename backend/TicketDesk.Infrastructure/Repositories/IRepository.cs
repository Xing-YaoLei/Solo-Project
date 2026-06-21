namespace TicketDesk.Infrastructure.Repositories;

public interface IRepository
{
    Task<T?> GetByIdAsync<T>(Guid id) where T : class;
    Task<IReadOnlyList<T>> ListAsync<T>() where T : class;
    Task AddAsync<T>(T entity) where T : class;
    Task UpdateAsync<T>(T entity) where T : class;
    Task DeleteAsync<T>(T entity) where T : class;
}
