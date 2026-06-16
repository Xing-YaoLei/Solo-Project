using ElderCareScheduling.API.Models.Entities;

namespace ElderCareScheduling.API.Repositories;

public interface IBedRepository : IBaseRepository<Bed>
{
    Task<IEnumerable<Bed>> GetAvailableBedsAsync();
}
