using LegalFeeScheduling.Infrastructure.Repositories;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace LegalFeeScheduling.Infrastructure.Hangfire.RecurringJobs;

public class SummaryStatisticsJob
{
    private readonly IQuoteRepository _quoteRepository;
    private readonly IMemoryCache _memoryCache;
    private readonly ILogger<SummaryStatisticsJob> _logger;

    public SummaryStatisticsJob(
        IQuoteRepository quoteRepository,
        IMemoryCache memoryCache,
        ILogger<SummaryStatisticsJob> logger)
    {
        _quoteRepository = quoteRepository;
        _memoryCache = memoryCache;
        _logger = logger;
    }

    public async Task ExecuteAsync()
    {
        _logger.LogInformation("SummaryStatisticsJob started at {Time}", DateTime.UtcNow);

        var today = DateTime.UtcNow.Date;
        var newQuotesCount = await _quoteRepository.GetNewQuotesCountAsync(today);
        var completedQuotesCount = await _quoteRepository.GetCompletedQuotesCountAsync(today);
        var collectedAmount = await _quoteRepository.GetCollectedAmountAsync(today);
        var exceptionCount = await _quoteRepository.GetExceptionCountAsync(today);

        var summary = new DailySummary
        {
            Date = today,
            NewQuoteCount = newQuotesCount,
            CompletedQuoteCount = completedQuotesCount,
            CollectedAmount = collectedAmount,
            ExceptionCount = exceptionCount,
            CalculatedAt = DateTime.UtcNow
        };

        var cacheKey = $"DailySummary_{today:yyyyMMdd}";
        _memoryCache.Set(cacheKey, summary, TimeSpan.FromDays(1));

        _logger.LogInformation(
            "SummaryStatisticsJob completed for {Date}. New quotes: {NewCount}, Completed: {CompletedCount}, Collected: {CollectedAmount:C}, Exceptions: {ExceptionCount}",
            today, newQuotesCount, completedQuotesCount, collectedAmount, exceptionCount);
    }
}

public class DailySummary
{
    public DateTime Date { get; set; }

    public int NewQuoteCount { get; set; }

    public int CompletedQuoteCount { get; set; }

    public decimal CollectedAmount { get; set; }

    public int ExceptionCount { get; set; }

    public DateTime CalculatedAt { get; set; }
}
