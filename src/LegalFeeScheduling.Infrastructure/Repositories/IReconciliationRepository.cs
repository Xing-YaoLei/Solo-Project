using LegalFeeScheduling.Domain.Entities;

namespace LegalFeeScheduling.Infrastructure.Repositories;

public interface IReconciliationRepository : IRepository<ReconciliationRecord>
{
    Task<IEnumerable<ReconciliationRecord>> GetByQuoteIdAsync(Guid quoteId);
    Task<ReconciliationRecord> CreateReconciliationAsync(ReconciliationRecord reconciliation);
}
