using LegalFeeScheduling.Domain.Entities;
using LegalFeeScheduling.Domain.Enums;
using LegalFeeScheduling.Infrastructure.Repositories;
using Microsoft.Extensions.Logging;

namespace LegalFeeScheduling.Infrastructure.Hangfire.RecurringJobs;

public class PaymentMonitoringJob
{
    private readonly IQuoteRepository _quoteRepository;
    private readonly ILogger<PaymentMonitoringJob> _logger;

    public PaymentMonitoringJob(IQuoteRepository quoteRepository, ILogger<PaymentMonitoringJob> logger)
    {
        _quoteRepository = quoteRepository;
        _logger = logger;
    }

    public async Task ExecuteAsync()
    {
        _logger.LogInformation("PaymentMonitoringJob started at {Time}", DateTime.UtcNow);

        var quotes = await _quoteRepository.GetUnclosedQuotesWithPaymentsAsync();
        var overdueQuotes = new List<Quote>();
        var today = DateTime.UtcNow;

        foreach (var quote in quotes)
        {
            var allPaid = quote.Payments.Any() && quote.Payments.All(p => p.Status == PaymentStatus.Paid);
            if (allPaid) continue;

            if (!quote.ExpectedPaymentDate.HasValue) continue;

            var daysOverdue = (today - quote.ExpectedPaymentDate.Value).TotalDays;
            if (daysOverdue >= 7)
            {
                overdueQuotes.Add(quote);

                foreach (var payment in quote.Payments.Where(p => p.Status != PaymentStatus.Paid && p.Status != PaymentStatus.Cancelled))
                {
                    payment.Status = PaymentStatus.Overdue;
                }

                _logger.LogInformation("Quote {QuoteNo} is overdue by {Days} days. Expected payment date: {ExpectedDate}",
                    quote.QuoteNo, daysOverdue, quote.ExpectedPaymentDate);
            }
        }

        if (overdueQuotes.Any())
        {
            foreach (var quote in overdueQuotes)
            {
                await _quoteRepository.UpdateAsync(quote);
            }

            _logger.LogInformation("PaymentMonitoringJob completed. {Count} quotes marked as overdue.", overdueQuotes.Count);
        }
        else
        {
            _logger.LogInformation("PaymentMonitoringJob completed. No overdue quotes found.");
        }
    }
}
