using LegalFeeScheduling.Domain.DTOs;
using LegalFeeScheduling.Domain.Entities;
using LegalFeeScheduling.Domain.Enums;
using LegalFeeScheduling.Infrastructure.Data;
using LegalFeeScheduling.Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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
    private readonly IRepository<AmountCheckResult> _amountCheckRepository;
    private readonly AppDbContext _context;

    public StatisticsController(
        IQuoteRepository quoteRepository,
        IPaymentRepository paymentRepository,
        IReconciliationRepository reconciliationRepository,
        IRepository<StatusHistory> statusHistoryRepository,
        IRepository<AmountCheckResult> amountCheckRepository,
        AppDbContext context)
    {
        _quoteRepository = quoteRepository;
        _paymentRepository = paymentRepository;
        _reconciliationRepository = reconciliationRepository;
        _statusHistoryRepository = statusHistoryRepository;
        _amountCheckRepository = amountCheckRepository;
        _context = context;
    }

    [HttpGet("dashboard")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<DashboardSummaryDto>> GetDashboard()
    {
        var allQuotes = (await _quoteRepository.GetAllAsync()).ToList();
        var allPayments = (await _paymentRepository.GetAllAsync()).ToList();
        var allReconciliations = (await _reconciliationRepository.GetAllAsync()).ToList();

        var today = DateTime.UtcNow.Date;
        var monthStart = new DateTime(today.Year, today.Month, 1);

        var pendingCount = allQuotes.Count(q =>
            q.Status == QuoteStatus.PendingReview ||
            q.Status == QuoteStatus.NeedMoreInfo ||
            q.Status == QuoteStatus.Escalated ||
            q.Status == QuoteStatus.Processing);

        var exceptionCount = allQuotes.Count(q => q.Status == QuoteStatus.AmountException);

        var monthlyCollectedAmount = allPayments
            .Where(p => p.PaymentDate >= monthStart)
            .Sum(p => p.Amount);

        var reconciliationDifferenceCount = allReconciliations
            .Count(r => r.Status == ReconciliationStatus.Mismatched);

        var totalQuoteCount = allQuotes.Count;

        var completedQuoteCount = allQuotes.Count(q =>
            q.Status == QuoteStatus.Completed ||
            q.Status == QuoteStatus.Closed);

        var totalAmount = allQuotes.Sum(q => q.Amount);

        var overdueCount = allPayments.Count(p => p.Status == PaymentStatus.Overdue);

        var result = new DashboardSummaryDto
        {
            PendingCount = pendingCount,
            ExceptionCount = exceptionCount,
            MonthlyCollectedAmount = monthlyCollectedAmount,
            ReconciliationDifferenceCount = reconciliationDifferenceCount,
            TotalQuoteCount = totalQuoteCount,
            CompletedQuoteCount = completedQuoteCount,
            TotalAmount = totalAmount,
            OverdueCount = overdueCount
        };

        return Ok(result);
    }

    [HttpGet("summary")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<PeriodSummaryDto>> GetSummary([FromQuery] string? period = "monthly")
    {
        var allQuotes = (await _quoteRepository.GetAllAsync()).ToList();
        var allPayments = (await _paymentRepository.GetAllAsync()).ToList();

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

        var result = new PeriodSummaryDto
        {
            Period = period ?? "monthly",
            StartDate = startDate,
            EndDate = now,
            TotalQuotes = quotesInPeriod.Count,
            TotalAmount = quotesInPeriod.Sum(q => q.Amount),
            TotalPaid = paymentsInPeriod.Sum(p => p.Amount),
            CompletedCount = quotesInPeriod.Count(q => q.Status == QuoteStatus.Completed || q.Status == QuoteStatus.Closed),
            ExceptionCount = quotesInPeriod.Count(q => q.Status == QuoteStatus.AmountException),
            StatusBreakdown = quotesInPeriod
                .GroupBy(q => q.Status)
                .Select(g => new StatusBreakdownItem
                {
                    Status = g.Key,
                    Count = g.Count(),
                    Amount = g.Sum(q => q.Amount)
                })
                .ToList()
        };

        return Ok(result);
    }

    [HttpGet("by-channel")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<ChannelStatisticsDto>>> GetByChannel()
    {
        var quotes = (await _quoteRepository.GetUnclosedQuotesWithPaymentsAsync()).ToList();

        var result = quotes
            .GroupBy(q => q.Channel)
            .Select(g =>
            {
                var totalAmount = g.Sum(q => q.Amount);
                var paidAmount = g.Sum(q => q.Payments.Sum(p => p.Amount));
                return new ChannelStatisticsDto
                {
                    Channel = g.Key,
                    QuoteCount = g.Count(),
                    TotalAmount = totalAmount,
                    PaidAmount = paidAmount,
                    OutstandingAmount = totalAmount - paidAmount,
                    CollectionRate = totalAmount > 0 ? Math.Round(paidAmount / totalAmount * 100, 2) : 0
                };
            })
            .ToList();

        return Ok(result);
    }

    [HttpGet("by-owner")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<OwnerStatisticsDto>>> GetByOwner()
    {
        var quotes = (await _quoteRepository.GetUnclosedQuotesWithPaymentsAsync()).ToList();

        var result = quotes
            .Where(q => !string.IsNullOrEmpty(q.Owner))
            .GroupBy(q => q.Owner!)
            .Select(g =>
            {
                var totalAmount = g.Sum(q => q.Amount);
                var paidAmount = g.Sum(q => q.Payments.Sum(p => p.Amount));
                var overdueCount = g.Sum(q => q.Payments.Count(p => p.Status == PaymentStatus.Overdue));
                return new OwnerStatisticsDto
                {
                    Owner = g.Key,
                    QuoteCount = g.Count(),
                    TotalAmount = totalAmount,
                    PaidAmount = paidAmount,
                    OutstandingAmount = totalAmount - paidAmount,
                    OverdueCount = overdueCount
                };
            })
            .OrderByDescending(x => x.TotalAmount)
            .ToList();

        return Ok(result);
    }

    [HttpGet("status-changes")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<StatusChangeSummaryDto>> GetStatusChanges([FromQuery] int? days = 30)
    {
        var periodDays = days ?? 30;
        var sinceDate = DateTime.UtcNow.AddDays(-periodDays);
        var histories = (await _statusHistoryRepository.GetAllAsync()).ToList();

        var recentChanges = histories
            .Where(h => h.ChangedAt >= sinceDate)
            .ToList();

        var result = new StatusChangeSummaryDto
        {
            PeriodDays = periodDays,
            TotalChanges = recentChanges.Count,
            Transitions = recentChanges
                .GroupBy(h => new { h.FromStatus, h.ToStatus })
                .Select(g => new StatusTransitionItem
                {
                    FromStatus = g.Key.FromStatus,
                    ToStatus = g.Key.ToStatus,
                    Count = g.Count()
                })
                .OrderByDescending(x => x.Count)
                .ToList(),
            ByDate = recentChanges
                .GroupBy(h => h.ChangedAt.Date)
                .Select(g => new StatusChangeByDateItem
                {
                    Date = g.Key,
                    Count = g.Count()
                })
                .OrderBy(x => x.Date)
                .ToList()
        };

        return Ok(result);
    }

    [HttpGet("payment-collection")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<PaymentCollectionDto>> GetPaymentCollection()
    {
        var quotes = (await _quoteRepository.GetAllAsync()).ToList();
        var payments = (await _paymentRepository.GetAllAsync()).ToList();

        var paymentData = quotes
            .Where(q => q.ExpectedPaymentDate.HasValue)
            .Select(q =>
            {
                var quotePayments = payments.Where(p => p.QuoteId == q.Id).OrderBy(p => p.PaymentDate).ToList();
                var firstPayment = quotePayments.FirstOrDefault();
                var lastPayment = quotePayments.LastOrDefault();
                var totalPaid = quotePayments.Sum(p => p.Amount);

                return new PaymentCollectionItemDto
                {
                    QuoteId = q.Id,
                    QuoteNo = q.QuoteNo,
                    ExpectedDate = q.ExpectedPaymentDate,
                    FirstPaymentDate = firstPayment?.PaymentDate,
                    LastPaymentDate = lastPayment?.PaymentDate,
                    TotalAmount = q.Amount,
                    PaidAmount = totalPaid,
                    OutstandingAmount = q.Amount - totalPaid,
                    CollectionDays = firstPayment != null && q.ExpectedPaymentDate.HasValue
                        ? (int?)(firstPayment.PaymentDate - q.ExpectedPaymentDate.Value).TotalDays
                        : null,
                    FullyPaid = totalPaid >= q.Amount - 0.01m
                };
            })
            .ToList();

        var completedPayments = paymentData.Where(p => p.FullyPaid && p.CollectionDays.HasValue).ToList();

        var result = new PaymentCollectionDto
        {
            TotalQuotes = paymentData.Count,
            FullyPaidCount = paymentData.Count(p => p.FullyPaid),
            PartiallyPaidCount = paymentData.Count(p => !p.FullyPaid && p.PaidAmount > 0),
            NotPaidCount = paymentData.Count(p => p.PaidAmount == 0),
            AverageCollectionDays = completedPayments.Any() ? completedPayments.Average(p => p.CollectionDays!.Value) : 0,
            Details = paymentData
        };

        return Ok(result);
    }

    [HttpGet("unbalanced-quotes")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<AmountCheckResult>>> GetUnbalancedQuotes()
    {
        var unbalancedResults = await _context.AmountCheckResults
            .Where(acr => !acr.IsMatch)
            .OrderByDescending(acr => acr.CheckedAt)
            .Take(100)
            .ToListAsync();

        return Ok(unbalancedResults);
    }
}
