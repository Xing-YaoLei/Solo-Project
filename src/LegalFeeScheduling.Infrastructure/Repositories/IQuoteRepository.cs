using LegalFeeScheduling.Domain.Entities;
using LegalFeeScheduling.Domain.Enums;

namespace LegalFeeScheduling.Infrastructure.Repositories;

public interface IQuoteRepository : IRepository<Quote>
{
    Task<Quote?> GetByIdWithDetailsAsync(Guid id);
    Task<Quote?> GetByQuoteNoAsync(string quoteNo);
    Task<(IEnumerable<Quote> Items, int TotalCount)> GetListAsync(
        QuoteStatus? status = null,
        Channel? channel = null,
        string? owner = null,
        DateTime? startDate = null,
        DateTime? endDate = null,
        string? keyword = null,
        int pageIndex = 1,
        int pageSize = 20);
    Task ChangeStatusAsync(Guid quoteId, QuoteStatus newStatus, string? changedBy = null, string? remarks = null);
    Task<IEnumerable<Quote>> GetUnclosedQuotesWithPaymentsAsync();
    Task<IEnumerable<Quote>> GetProcessingQuotesWithReconciliationsAsync();
    Task<int> GetNewQuotesCountAsync(DateTime date);
    Task<int> GetCompletedQuotesCountAsync(DateTime date);
    Task<decimal> GetCollectedAmountAsync(DateTime date);
    Task<int> GetExceptionCountAsync(DateTime date);
}
