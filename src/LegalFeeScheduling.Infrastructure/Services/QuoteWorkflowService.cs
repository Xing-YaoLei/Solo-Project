using LegalFeeScheduling.Domain.Entities;
using LegalFeeScheduling.Domain.Enums;
using LegalFeeScheduling.Infrastructure.Data;
using LegalFeeScheduling.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace LegalFeeScheduling.Infrastructure.Services;

public class QuoteWorkflowService : IQuoteWorkflowService
{
    private readonly IQuoteRepository _quoteRepository;
    private readonly AppDbContext _context;

    public QuoteWorkflowService(IQuoteRepository quoteRepository, AppDbContext context)
    {
        _quoteRepository = quoteRepository;
        _context = context;
    }

    private async Task<Quote?> GetQuoteAsync(Guid quoteId)
    {
        return await _context.Quotes.FindAsync(quoteId);
    }

    private void ValidateTransition(QuoteStatus current, QuoteStatus target)
    {
        var allowed = current switch
        {
            QuoteStatus.Draft => new[] { QuoteStatus.PendingReview, QuoteStatus.AmountException },
            QuoteStatus.PendingReview => new[] { QuoteStatus.Approved, QuoteStatus.NeedMoreInfo, QuoteStatus.Escalated, QuoteStatus.AmountException },
            QuoteStatus.NeedMoreInfo => new[] { QuoteStatus.PendingReview, QuoteStatus.AmountException },
            QuoteStatus.Escalated => new[] { QuoteStatus.Approved, QuoteStatus.NeedMoreInfo, QuoteStatus.AmountException },
            QuoteStatus.Approved => new[] { QuoteStatus.Processing, QuoteStatus.AmountException },
            QuoteStatus.Processing => new[] { QuoteStatus.Completed, QuoteStatus.AmountException },
            QuoteStatus.Completed => new[] { QuoteStatus.Closed, QuoteStatus.AmountException },
            QuoteStatus.AmountException => new[] { QuoteStatus.Processing },
            QuoteStatus.Closed => Array.Empty<QuoteStatus>(),
            _ => Array.Empty<QuoteStatus>()
        };

        if (!allowed.Contains(target))
        {
            throw new InvalidOperationException($"不允许从 {current} 状态流转到 {target} 状态");
        }
    }

    private async Task ChangeStatusWithHistoryAsync(
        Guid quoteId,
        QuoteStatus newStatus,
        string? changedBy,
        string? remarks,
        Action<Quote>? updateQuote = null)
    {
        var quote = await GetQuoteAsync(quoteId);
        if (quote is null)
        {
            throw new InvalidOperationException($"报价单 {quoteId} 不存在");
        }

        ValidateTransition(quote.Status, newStatus);

        var oldStatus = quote.Status;
        quote.Status = newStatus;

        updateQuote?.Invoke(quote);

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

    public async Task SubmitForReviewAsync(Guid quoteId, string? userId = null)
    {
        await ChangeStatusWithHistoryAsync(
            quoteId,
            QuoteStatus.PendingReview,
            userId,
            "提交审核");
    }

    public async Task ApproveAsync(Guid quoteId, string? userId = null)
    {
        await ChangeStatusWithHistoryAsync(
            quoteId,
            QuoteStatus.Approved,
            userId,
            "审核通过",
            q =>
            {
                q.ApprovedAt = DateTime.UtcNow;
                q.ApprovedBy = userId;
            });
    }

    public async Task RejectWithNeedMoreInfoAsync(Guid quoteId, string reason, string? userId = null)
    {
        await ChangeStatusWithHistoryAsync(
            quoteId,
            QuoteStatus.NeedMoreInfo,
            userId,
            $"需补充资料: {reason}");
    }

    public async Task EscalateAsync(Guid quoteId, string reason, string? userId = null)
    {
        await ChangeStatusWithHistoryAsync(
            quoteId,
            QuoteStatus.Escalated,
            userId,
            $"已升级: {reason}");
    }

    public async Task StartProcessingAsync(Guid quoteId, string? userId = null)
    {
        await ChangeStatusWithHistoryAsync(
            quoteId,
            QuoteStatus.Processing,
            userId,
            "开始处理");
    }

    public async Task MarkCompletedAsync(Guid quoteId, string? userId = null)
    {
        await ChangeStatusWithHistoryAsync(
            quoteId,
            QuoteStatus.Completed,
            userId,
            "标记完成",
            q =>
            {
                q.CompletedAt = DateTime.UtcNow;
            });
    }

    public async Task CloseAsync(Guid quoteId, string? userId = null)
    {
        await ChangeStatusWithHistoryAsync(
            quoteId,
            QuoteStatus.Closed,
            userId,
            "关闭",
            q =>
            {
                q.ClosedAt = DateTime.UtcNow;
            });
    }

    public async Task HandleAmountExceptionAsync(Guid quoteId, string reason, string? userId = null)
    {
        var quote = await GetQuoteAsync(quoteId);
        if (quote is null)
        {
            throw new InvalidOperationException($"报价单 {quoteId} 不存在");
        }

        if (quote.Status == QuoteStatus.Closed)
        {
            throw new InvalidOperationException("已关闭的报价单不能标记为金额异常");
        }

        if (quote.Status == QuoteStatus.AmountException)
        {
            return;
        }

        var oldStatus = quote.Status;
        quote.Status = QuoteStatus.AmountException;

        var statusHistory = new StatusHistory
        {
            Id = Guid.NewGuid(),
            QuoteId = quoteId,
            FromStatus = oldStatus,
            ToStatus = QuoteStatus.AmountException,
            ChangedAt = DateTime.UtcNow,
            ChangedBy = userId ?? string.Empty,
            Remarks = $"金额异常: {reason}"
        };

        _context.StatusHistories.Add(statusHistory);
        await _context.SaveChangesAsync();
    }

    public async Task ResumeFromExceptionAsync(Guid quoteId, string? reason = null, string? userId = null)
    {
        await ChangeStatusWithHistoryAsync(
            quoteId,
            QuoteStatus.Processing,
            userId,
            string.IsNullOrEmpty(reason) ? "金额异常已解决，恢复处理" : $"金额异常已解决，恢复处理: {reason}");
    }
}
