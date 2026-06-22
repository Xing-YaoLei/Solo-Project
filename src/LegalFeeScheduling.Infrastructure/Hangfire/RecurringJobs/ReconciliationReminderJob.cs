using LegalFeeScheduling.Domain.Entities;
using LegalFeeScheduling.Domain.Enums;
using LegalFeeScheduling.Infrastructure.Repositories;
using Microsoft.Extensions.Logging;

namespace LegalFeeScheduling.Infrastructure.Hangfire.RecurringJobs;

public class ReconciliationReminderJob
{
    private readonly IQuoteRepository _quoteRepository;
    private readonly ILogger<ReconciliationReminderJob> _logger;

    public ReconciliationReminderJob(IQuoteRepository quoteRepository, ILogger<ReconciliationReminderJob> logger)
    {
        _quoteRepository = quoteRepository;
        _logger = logger;
    }

    public async Task ExecuteAsync()
    {
        _logger.LogInformation("ReconciliationReminderJob started at {Time}", DateTime.UtcNow);

        var quotes = await _quoteRepository.GetProcessingQuotesWithReconciliationsAsync();
        var followUpQuotes = new List<Quote>();
        var today = DateTime.UtcNow;

        foreach (var quote in quotes)
        {
            var lastReconciliation = quote.Reconciliations
                .OrderByDescending(r => r.ReconcileDate)
                .FirstOrDefault();

            bool reconciliationCompleted = lastReconciliation != null &&
                (lastReconciliation.Status == ReconciliationStatus.Matched ||
                 lastReconciliation.Status == ReconciliationStatus.Resolved);

            if (reconciliationCompleted) continue;

            DateTime referenceDate = lastReconciliation?.ReconcileDate ?? quote.CreatedAt;
            var daysSinceReconciliation = (today - referenceDate).TotalDays;

            if (daysSinceReconciliation >= 3)
            {
                followUpQuotes.Add(quote);
                _logger.LogInformation(
                    "Quote {QuoteNo} needs reconciliation follow-up. Last reconciliation: {LastReconciliation}. Days since: {Days}",
                    quote.QuoteNo,
                    lastReconciliation?.ReconcileDate.ToString() ?? "Never",
                    daysSinceReconciliation);
            }
        }

        if (followUpQuotes.Any())
        {
            _logger.LogInformation(
                "ReconciliationReminderJob completed. {Count} quotes need follow-up: {QuoteNos}",
                followUpQuotes.Count,
                string.Join(", ", followUpQuotes.Select(q => q.QuoteNo)));
        }
        else
        {
            _logger.LogInformation("ReconciliationReminderJob completed. No quotes need follow-up.");
        }

        await Task.CompletedTask;
    }
}
