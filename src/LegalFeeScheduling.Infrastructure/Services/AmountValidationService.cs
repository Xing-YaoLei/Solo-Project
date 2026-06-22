using LegalFeeScheduling.Domain.Entities;
using LegalFeeScheduling.Domain.Enums;
using LegalFeeScheduling.Infrastructure.Repositories;

namespace LegalFeeScheduling.Infrastructure.Services;

public class AmountValidationService : IAmountValidationService
{
    private readonly IQuoteRepository _quoteRepository;
    private readonly IPaymentRepository _paymentRepository;
    private readonly IReconciliationRepository _reconciliationRepository;
    private readonly IRepository<AmountCheckResult> _amountCheckResultRepository;

    public AmountValidationService(
        IQuoteRepository quoteRepository,
        IPaymentRepository paymentRepository,
        IReconciliationRepository reconciliationRepository,
        IRepository<AmountCheckResult> amountCheckResultRepository)
    {
        _quoteRepository = quoteRepository;
        _paymentRepository = paymentRepository;
        _reconciliationRepository = reconciliationRepository;
        _amountCheckResultRepository = amountCheckResultRepository;
    }

    public async Task<AmountCheckResult> ValidateQuoteAmountsAsync(Guid quoteId, string? checkedBy = null)
    {
        var quote = await _quoteRepository.GetByIdWithDetailsAsync(quoteId);
        if (quote is null)
        {
            throw new InvalidOperationException($"Quote with id {quoteId} not found");
        }

        var itemsTotal = quote.Items.Sum(qi => qi.Subtotal);
        var expectedFinalAmount = quote.Amount - quote.DiscountAmount;
        var isMatch = Math.Abs(itemsTotal - quote.Amount) < 0.01m
                      && Math.Abs(expectedFinalAmount - quote.FinalAmount) < 0.01m;

        var result = new AmountCheckResult
        {
            Id = Guid.NewGuid(),
            QuoteId = quoteId,
            CheckType = AmountCheckType.QuoteItemsVsQuoteAmount,
            ExpectedAmount = quote.Amount,
            ActualAmount = itemsTotal,
            Difference = quote.Amount - itemsTotal,
            IsMatch = isMatch,
            CheckedAt = DateTime.UtcNow,
            CheckedBy = checkedBy ?? string.Empty,
            Remarks = isMatch
                ? "金额校验通过"
                : $"明细合计({itemsTotal})与报价单金额({quote.Amount})差异: {quote.Amount - itemsTotal}; " +
                  $"折扣后金额计算值({expectedFinalAmount})与报价单最终金额({quote.FinalAmount})差异: {expectedFinalAmount - quote.FinalAmount}"
        };

        await _amountCheckResultRepository.AddAsync(result);

        if (!isMatch && quote.Status != QuoteStatus.Closed && quote.Status != QuoteStatus.AmountException)
        {
            await _quoteRepository.ChangeStatusAsync(
                quoteId,
                QuoteStatus.AmountException,
                checkedBy,
                "金额校验异常：" + result.Remarks);
        }

        return result;
    }

    public async Task<AmountCheckResult> ValidatePaymentsVsReconciliationAsync(Guid quoteId, string? checkedBy = null)
    {
        var quote = await _quoteRepository.GetByIdWithDetailsAsync(quoteId);
        if (quote is null)
        {
            throw new InvalidOperationException($"Quote with id {quoteId} not found");
        }

        var payments = await _paymentRepository.GetByQuoteIdAsync(quoteId);
        var reconciliations = await _reconciliationRepository.GetByQuoteIdAsync(quoteId);

        var totalPayments = payments.Sum(p => p.Amount);
        var totalReconciled = reconciliations.Sum(r => r.ActualAmount);
        var difference = totalPayments - totalReconciled;
        var isMatch = Math.Abs(difference) < 0.01m;

        var result = new AmountCheckResult
        {
            Id = Guid.NewGuid(),
            QuoteId = quoteId,
            CheckType = AmountCheckType.PaymentsVsReconciliation,
            ExpectedAmount = totalPayments,
            ActualAmount = totalReconciled,
            Difference = difference,
            IsMatch = isMatch,
            CheckedAt = DateTime.UtcNow,
            CheckedBy = checkedBy ?? string.Empty,
            Remarks = isMatch
                ? "支付与对账金额一致"
                : $"支付合计({totalPayments})与对账合计({totalReconciled})差异: {difference}"
        };

        await _amountCheckResultRepository.AddAsync(result);

        if (!isMatch && quote.Status != QuoteStatus.Closed && quote.Status != QuoteStatus.AmountException)
        {
            await _quoteRepository.ChangeStatusAsync(
                quoteId,
                QuoteStatus.AmountException,
                checkedBy,
                "支付与对账金额异常：" + result.Remarks);
        }

        return result;
    }
}
