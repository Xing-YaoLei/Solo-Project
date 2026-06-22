using LegalFeeScheduling.Domain.Entities;
using LegalFeeScheduling.Domain.Enums;
using LegalFeeScheduling.Infrastructure.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace LegalFeeScheduling.API.Controllers;

[ApiController]
[Route("api/statistics")]
[Produces("application/json")]
public class StatisticsController : ControllerBase
{
    private readonly IQuoteRepository _quoteRepository;
    private readonly IPaymentRepository _paymentRepository;
    private readonly IReconciliationRepository _reconciliationRepository;
    private readonly IRepository<StatusHistory> _statusHistoryRepository;

    public StatisticsController(
        IQuoteRepository quoteRepository,
        IPaymentRepository paymentRepository,
        IReconciliationRepository reconciliationRepository,
        IRepository<StatusHistory> statusHistoryRepository)
    {
        _quoteRepository = quoteRepository;
        _paymentRepository = paymentRepository;
        _reconciliationRepository = reconciliationRepository;
        _statusHistoryRepository = statusHistoryRepository;
    }

    [HttpGet("summary")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<object>> GetSummary([FromQuery] string? period = "monthly")
    {
        var allQuotes = await _quoteRepository.GetAllAsync();
        var allPayments = await _paymentRepository.GetAllAsync();

        DateTime startDate;
        var now = DateTime.UtcNow;

        switch (period?.ToLower())
        {
            case "yearly":
                startDate = new DateTime(now.Year, 1, 1);
                break;
            case "quarterly":
                var quarter = (now.Month - 1) / 3 + 1;
                startDate = new DateTime(now.Year, (quarter - 1) * 3 + 1, 1);
                break;
            case "monthly":
            default:
                startDate = new DateTime(now.Year, now.Month, 1);
                break;
        }

        var quotesInPeriod = allQuotes.Where(q => q.CreatedAt >= startDate).ToList();
        var paymentsInPeriod = allPayments.Where(p => p.PaymentDate >= startDate).ToList();

        var result = new
        {
            period,
            startDate,
            endDate = now,
            totalQuotes = quotesInPeriod.Count,
            totalAmount = quotesInPeriod.Sum(q => q.Amount),
            totalPaid = paymentsInPeriod.Sum(p => p.Amount),
            averageQuoteAmount = quotesInPeriod.Any() ? quotesInPeriod.Average(q => q.Amount) : 0,
            quoteStatusBreakdown = quotesInPeriod
                .GroupBy(q => q.Status)
                .Select(g => new
                {
                    status = g.Key.ToString(),
                    count = g.Count(),
                    amount = g.Sum(q => q.Amount)
                })
                .ToList()
        };

        return Ok(result);
    }

    [HttpGet("by-channel")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<object>> GetByChannel()
    {
        var quotes = (await _quoteRepository.GetUnclosedQuotesWithPaymentsAsync()).ToList();

        var result = quotes
            .GroupBy(q => q.Channel)
            .Select(g => new
            {
                channel = g.Key.ToString(),
                quoteCount = g.Count(),
                totalAmount = g.Sum(q => q.Amount),
                averageAmount = g.Any() ? g.Average(q => q.Amount) : 0,
                paidAmount = g.Sum(q => q.Payments.Sum(p => p.Amount))
            })
            .ToList();

        return Ok(result);
    }

    [HttpGet("by-owner")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<object>> GetByOwner()
    {
        var quotes = (await _quoteRepository.GetUnclosedQuotesWithPaymentsAsync()).ToList();

        var result = quotes
            .Where(q => !string.IsNullOrEmpty(q.Owner))
            .GroupBy(q => q.Owner!)
            .Select(g =>
            {
                var totalAmount = g.Sum(q => q.Amount);
                var paidAmount = g.Sum(q => q.Payments.Sum(p => p.Amount));
                return new
                {
                    owner = g.Key,
                    quoteCount = g.Count(),
                    totalAmount,
                    paidAmount,
                    outstandingAmount = totalAmount - paidAmount
                };
            })
            .OrderByDescending(x => x.totalAmount)
            .ToList();

        return Ok(result);
    }

    [HttpGet("status-changes")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<object>> GetStatusChanges([FromQuery] int? days = 30)
    {
        var sinceDate = DateTime.UtcNow.AddDays(-(days ?? 30));
        var histories = await _statusHistoryRepository.GetAllAsync();

        var recentChanges = histories
            .Where(h => h.ChangedAt >= sinceDate)
            .ToList();

        var result = new
        {
            periodDays = days ?? 30,
            totalChanges = recentChanges.Count,
            byTransition = recentChanges
                .GroupBy(h => new { h.FromStatus, h.ToStatus })
                .Select(g => new
                {
                    fromStatus = g.Key.FromStatus.ToString(),
                    toStatus = g.Key.ToStatus.ToString(),
                    count = g.Count()
                })
                .OrderByDescending(x => x.count)
                .ToList(),
            byDate = recentChanges
                .GroupBy(h => h.ChangedAt.Date)
                .Select(g => new
                {
                    date = g.Key,
                    count = g.Count()
                })
                .OrderBy(x => x.date)
                .ToList()
        };

        return Ok(result);
    }

    [HttpGet("payment-collection")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<object>> GetPaymentCollection()
    {
        var quotes = (await _quoteRepository.GetAllAsync()).ToList();
        var payments = await _paymentRepository.GetAllAsync();

        var paymentData = quotes
            .Where(q => q.ExpectedPaymentDate.HasValue)
            .Select(q =>
            {
                var quotePayments = payments.Where(p => p.QuoteId == q.Id).OrderBy(p => p.PaymentDate).ToList();
                var firstPayment = quotePayments.FirstOrDefault();
                var lastPayment = quotePayments.LastOrDefault();
                var totalPaid = quotePayments.Sum(p => p.Amount);

                return new
                {
                    quoteId = q.Id,
                    quoteNo = q.QuoteNo,
                    expectedDate = q.ExpectedPaymentDate,
                    firstPaymentDate = firstPayment?.PaymentDate,
                    lastPaymentDate = lastPayment?.PaymentDate,
                    totalAmount = q.Amount,
                    paidAmount = totalPaid,
                    outstandingAmount = q.Amount - totalPaid,
                    collectionDays = firstPayment != null && q.ExpectedPaymentDate.HasValue
                        ? (int?)(firstPayment.PaymentDate - q.ExpectedPaymentDate.Value).TotalDays
                        : null,
                    fullyPaid = totalPaid >= q.Amount - 0.01m
                };
            })
            .ToList();

        var completedPayments = paymentData.Where(p => p.fullyPaid && p.collectionDays.HasValue).ToList();

        var result = new
        {
            totalQuotes = paymentData.Count,
            fullyPaidCount = paymentData.Count(p => p.fullyPaid),
            partiallyPaidCount = paymentData.Count(p => !p.fullyPaid && p.paidAmount > 0),
            notPaidCount = paymentData.Count(p => p.paidAmount == 0),
            averageCollectionDays = completedPayments.Any() ? completedPayments.Average(p => p.collectionDays!.Value) : 0,
            details = paymentData
        };

        return Ok(result);
    }

    [HttpGet("dashboard")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<object>> GetDashboard()
    {
        var allQuotes = (await _quoteRepository.GetAllAsync()).ToList();
        var allPayments = await _paymentRepository.GetAllAsync();
        var allReconciliations = await _reconciliationRepository.GetAllAsync();

        var today = DateTime.UtcNow.Date;
        var monthStart = new DateTime(today.Year, today.Month, 1);
        var lastMonthStart = monthStart.AddMonths(-1);

        var thisMonthQuotes = allQuotes.Where(q => q.CreatedAt >= monthStart).ToList();
        var lastMonthQuotes = allQuotes.Where(q => q.CreatedAt >= lastMonthStart && q.CreatedAt < monthStart).ToList();

        var pendingReviewCount = allQuotes.Count(q => q.Status == QuoteStatus.PendingReview);
        var needMoreInfoCount = allQuotes.Count(q => q.Status == QuoteStatus.NeedMoreInfo);
        var processingCount = allQuotes.Count(q => q.Status == QuoteStatus.Processing);
        var amountExceptionCount = allQuotes.Count(q => q.Status == QuoteStatus.AmountException);

        var pendingReconciliation = allReconciliations.Count(r =>
            r.Status == ReconciliationStatus.Pending ||
            r.Status == ReconciliationStatus.InProgress ||
            r.Status == ReconciliationStatus.Mismatched);

        var totalAmount = allQuotes.Sum(q => q.Amount);
        var totalPaid = allPayments.Sum(p => p.Amount);
        var totalOutstanding = totalAmount - totalPaid;

        var result = new
        {
            overview = new
            {
                totalQuotes = allQuotes.Count(),
                thisMonthNewQuotes = thisMonthQuotes.Count,
                lastMonthNewQuotes = lastMonthQuotes.Count,
                totalAmount,
                totalPaid,
                totalOutstanding,
                collectionRate = totalAmount > 0 ? Math.Round(totalPaid / totalAmount * 100, 2) : 0
            },
            actionableItems = new
            {
                pendingReview = pendingReviewCount,
                needMoreInfo = needMoreInfoCount,
                processing = processingCount,
                amountException = amountExceptionCount,
                pendingReconciliation
            },
            recentActivity = new
            {
                recentQuotes = allQuotes
                    .OrderByDescending(q => q.CreatedAt)
                    .Take(10)
                    .Select(q => new
                    {
                        q.Id,
                        q.QuoteNo,
                        q.CaseName,
                        q.ClientName,
                        q.Status,
                        q.Amount,
                        q.CreatedAt
                    })
                    .ToList(),
                recentPayments = allPayments
                    .OrderByDescending(p => p.CreatedAt)
                    .Take(10)
                    .Select(p => new
                    {
                        p.Id,
                        p.PaymentNo,
                        p.QuoteId,
                        p.Amount,
                        p.PaymentDate,
                        p.Status,
                        p.CreatedAt
                    })
                    .ToList()
            },
            statusDistribution = allQuotes
                .GroupBy(q => q.Status)
                .Select(g => new
                {
                    status = g.Key.ToString(),
                    count = g.Count(),
                    amount = g.Sum(q => q.Amount)
                })
                .ToList()
        };

        return Ok(result);
    }
}
