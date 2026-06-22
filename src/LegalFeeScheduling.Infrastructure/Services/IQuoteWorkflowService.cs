namespace LegalFeeScheduling.Infrastructure.Services;

public interface IQuoteWorkflowService
{
    Task SubmitForReviewAsync(Guid quoteId, string? userId = null);
    Task ApproveAsync(Guid quoteId, string? userId = null);
    Task RejectWithNeedMoreInfoAsync(Guid quoteId, string reason, string? userId = null);
    Task EscalateAsync(Guid quoteId, string reason, string? userId = null);
    Task StartProcessingAsync(Guid quoteId, string? userId = null);
    Task MarkCompletedAsync(Guid quoteId, string? userId = null);
    Task CloseAsync(Guid quoteId, string? userId = null);
    Task HandleAmountExceptionAsync(Guid quoteId, string reason, string? userId = null);
    Task ResumeFromExceptionAsync(Guid quoteId, string? reason = null, string? userId = null);
}
