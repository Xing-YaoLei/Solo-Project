using ElderCareScheduling.API.Models.Entities;

namespace ElderCareScheduling.API.Repositories;

public interface IMedicationRepository : IBaseRepository<Medication>
{
    Task<IEnumerable<Medication>> GetByElderIdAsync(Guid elderId);
}
