using ElderCareScheduling.API.Models.Entities;

namespace ElderCareScheduling.API.Repositories;

public interface IElderRepository : IBaseRepository<Elder>
{
    Task<Elder?> GetWithDetailsAsync(Guid id);
}
