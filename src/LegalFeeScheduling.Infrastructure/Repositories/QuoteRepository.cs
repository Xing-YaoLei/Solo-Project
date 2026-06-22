using LegalFeeScheduling.Domain.Entities;
using LegalFeeScheduling.Domain.Enums;
using LegalFeeScheduling.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LegalFeeScheduling.Infrastructure.Repositories;

public class QuoteRepository : Repository<Quote>, IQuoteRepository
{
    public QuoteRepository(AppDbContext context) : base(context) { }

    public async Task<Quote?> GetByIdWithDetailsAsync(Guid id)
    {
        return await _dbSet
            .Include(q => q.Items)
            .Include(q => q.Payments)
            .Include(q => q.Reconciliations)
            .Include(q => q.StatusHistories)
            .Include(q => q.AmountChecks)
            .FirstOrDefaultAsync(q => q.Id == id);
    }

    public async Task<Quote?> GetByQuoteNoAsync(string quoteNo)
    {
        return await _dbSet
            .Include(q => q.Items)
            .Include(q => q.Payments)
            .Include(q => q.Reconciliations)
            .Include(q => q.StatusHistories)
            .Include(q => q.AmountChecks)
            .FirstOrDefaultAsync(q => q.QuoteNo == quoteNo);
    }

    public async Task<(IEnumerable<Quote> Items, int TotalCount)> GetListAsync(
        QuoteStatus? status = null,
        Channel? channel = null,
        string? owner = null,
        DateTime? startDate = null,
        DateTime? endDate = null,
        string? keyword = null,
        int pageIndex = 1,
        int pageSize = 20)
    {
        var query = _dbSet.AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(q => q.Status == status.Value);
        }

        if (channel.HasValue)
        {
            query = query.Where(q => q.Channel == channel.Value);
        }

        if (!string.IsNullOrWhiteSpace(owner))
        {
            query = query.Where(q => q.Owner == owner);
        }

        if (startDate.HasValue)
        {
            query = query.Where(q => q.CreatedAt >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            query = query.Where(q => q.CreatedAt <= endDate.Value);
        }

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            query = query.Where(q =>
                q.QuoteNo.Contains(keyword) ||
                q.CaseName.Contains(keyword) ||
                q.ClientName.Contains(keyword));
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(q => q.CreatedAt)
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task ChangeStatusAsync(Guid quoteId, QuoteStatus newStatus, string? changedBy = null, string? remarks = null)
    {
        var quote = await _dbSet.FindAsync(quoteId);
        if (quote is null) return;

        var oldStatus = quote.Status;
        quote.Status = newStatus;

        var statusHistory = new StatusHistory
        {
            Id = Guid.NewGuid(),
            QuoteId = quoteId,
            FromStatus = oldStatus,
            ToStatus = newStatus,
            ChangedAt = DateTime.UtcNow,
            ChangedBy = changedBy ?? string.Empty,
            Remarks = remarks
        };

        _context.StatusHistories.Add(statusHistory);
        await _context.SaveChangesAsync();
    }

    public async Task<IEnumerable<Quote>> GetUnclosedQuotesWithPaymentsAsync()
    {
        return await _dbSet
            .Include(q => q.Payments)
            .Where(q => q.Status != QuoteStatus.Closed)
            .ToListAsync();
    }

    public async Task<IEnumerable<Quote>> GetProcessingQuotesWithReconciliationsAsync()
    {
        return await _dbSet
            .Include(q => q.Reconciliations)
            .Where(q => q.Status == QuoteStatus.Processing)
            .ToListAsync();
    }

    public async Task<int> GetNewQuotesCountAsync(DateTime date)
    {
        var startOfDay = date.Date;
        var endOfDay = startOfDay.AddDays(1);
        return await _dbSet.CountAsync(q => q.CreatedAt >= startOfDay && q.CreatedAt < endOfDay);
    }

    public async Task<int> GetCompletedQuotesCountAsync(DateTime date)
    {
        var startOfDay = date.Date;
        var endOfDay = startOfDay.AddDays(1);
        return await _dbSet.CountAsync(q =>
            q.Status == QuoteStatus.Completed &&
            q.CompletedAt.HasValue &&
            q.CompletedAt.Value >= startOfDay &&
            q.CompletedAt.Value < endOfDay);
    }

    public async Task<decimal> GetCollectedAmountAsync(DateTime date)
    {
        var startOfDay = date.Date;
        var endOfDay = startOfDay.AddDays(1);
        return await _context.PaymentRecords
            .Where(p => p.PaymentDate >= startOfDay && p.PaymentDate < endOfDay)
            .SumAsync(p => p.Amount);
    }

    public async Task<int> GetExceptionCountAsync(DateTime date)
    {
        var startOfDay = date.Date;
        var endOfDay = startOfDay.AddDays(1);
        return await _context.StatusHistories.CountAsync(sh =>
            sh.ToStatus == QuoteStatus.AmountException &&
            sh.ChangedAt >= startOfDay &&
            sh.ChangedAt < endOfDay);
    }
}
