using LegalFeeScheduling.Domain.Entities;
using LegalFeeScheduling.Domain.Enums;
using LegalFeeScheduling.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LegalFeeScheduling.Infrastructure.Repositories;

public class ReconciliationRepository : Repository<ReconciliationRecord>, IReconciliationRepository
{
    public ReconciliationRepository(AppDbContext context) : base(context) { }

    public async Task<IEnumerable<ReconciliationRecord>> GetByQuoteIdAsync(Guid quoteId)
    {
        return await _dbSet
            .Where(r => r.QuoteId == quoteId)
            .OrderByDescending(r => r.ReconcileDate)
            .ToListAsync();
    }

    public async Task<ReconciliationRecord> CreateReconciliationAsync(ReconciliationRecord reconciliation)
    {
        if (reconciliation.Id == Guid.Empty)
        {
            reconciliation.Id = Guid.NewGuid();
        }

        reconciliation.Difference = reconciliation.ExpectedAmount - reconciliation.ActualAmount;

        if (Math.Abs(reconciliation.Difference) < 0.01m)
        {
            reconciliation.Status = ReconciliationStatus.Matched;
        }
        else
        {
            reconciliation.Status = ReconciliationStatus.Mismatched;
        }

        await _dbSet.AddAsync(reconciliation);
        await _context.SaveChangesAsync();
        return reconciliation;
    }
}
