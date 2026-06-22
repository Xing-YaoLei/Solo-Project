namespace LegalFeeScheduling.Domain.Enums;

public enum QuoteStatus
{
    Draft,
    PendingReview,
    NeedMoreInfo,
    Escalated,
    Approved,
    Processing,
    Completed,
    Closed,
    AmountException
}
