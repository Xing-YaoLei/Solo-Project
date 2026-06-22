using LegalFeeScheduling.Domain.Entities;

namespace LegalFeeScheduling.Infrastructure.Services;

public interface IAmountValidationService
{
    Task<AmountCheckResult> ValidateQuoteAmountsAsync(Guid quoteId, string? checkedBy = null);
    Task<AmountCheckResult> ValidatePaymentsVsReconciliationAsync(Guid quoteId, string? checkedBy = null);
}
