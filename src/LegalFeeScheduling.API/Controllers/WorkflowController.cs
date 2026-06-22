using LegalFeeScheduling.Domain.DTOs;
using LegalFeeScheduling.Domain.Entities;
using LegalFeeScheduling.Infrastructure.Repositories;
using LegalFeeScheduling.Infrastructure.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace LegalFeeScheduling.API.Controllers;

[ApiController]
[Route("api/workflow")]
[Produces("application/json")]
public class WorkflowController : ControllerBase
{
    private readonly IQuoteWorkflowService _workflowService;
    private readonly IQuoteRepository _quoteRepository;
    private readonly IRepository<StatusHistory> _statusHistoryRepository;

    public WorkflowController(
        IQuoteWorkflowService workflowService,
        IQuoteRepository quoteRepository,
        IRepository<StatusHistory> statusHistoryRepository)
    {
        _workflowService = workflowService;
        _quoteRepository = quoteRepository;
        _statusHistoryRepository = statusHistoryRepository;
    }

    [HttpPost("{quoteId:guid}/submit")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Quote>> Submit(Guid quoteId)
    {
        var quote = await _quoteRepository.GetByIdAsync(quoteId);
        if (quote is null)
        {
            return NotFound();
        }

        await _workflowService.SubmitForReviewAsync(quoteId, "current");
        var updated = await _quoteRepository.GetByIdWithDetailsAsync(quoteId);
        return Ok(updated);
    }

    [HttpPost("{quoteId:guid}/approve")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Quote>> Approve(Guid quoteId)
    {
        var quote = await _quoteRepository.GetByIdAsync(quoteId);
        if (quote is null)
        {
            return NotFound();
        }

        await _workflowService.ApproveAsync(quoteId, "current");
        var updated = await _quoteRepository.GetByIdWithDetailsAsync(quoteId);
        return Ok(updated);
    }

    [HttpPost("{quoteId:guid}/need-more-info")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Quote>> NeedMoreInfo(Guid quoteId, [FromBody] WorkflowReasonDto dto)
    {
        var quote = await _quoteRepository.GetByIdAsync(quoteId);
        if (quote is null)
        {
            return NotFound();
        }

        await _workflowService.RejectWithNeedMoreInfoAsync(quoteId, dto.Reason ?? string.Empty, "current");
        var updated = await _quoteRepository.GetByIdWithDetailsAsync(quoteId);
        return Ok(updated);
    }

    [HttpPost("{quoteId:guid}/escalate")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Quote>> Escalate(Guid quoteId, [FromBody] WorkflowReasonDto dto)
    {
        var quote = await _quoteRepository.GetByIdAsync(quoteId);
        if (quote is null)
        {
            return NotFound();
        }

        await _workflowService.EscalateAsync(quoteId, dto.Reason ?? string.Empty, "current");
        var updated = await _quoteRepository.GetByIdWithDetailsAsync(quoteId);
        return Ok(updated);
    }

    [HttpPost("{quoteId:guid}/start-processing")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Quote>> StartProcessing(Guid quoteId)
    {
        var quote = await _quoteRepository.GetByIdAsync(quoteId);
        if (quote is null)
        {
            return NotFound();
        }

        await _workflowService.StartProcessingAsync(quoteId, "current");
        var updated = await _quoteRepository.GetByIdWithDetailsAsync(quoteId);
        return Ok(updated);
    }

    [HttpPost("{quoteId:guid}/complete")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Quote>> Complete(Guid quoteId)
    {
        var quote = await _quoteRepository.GetByIdAsync(quoteId);
        if (quote is null)
        {
            return NotFound();
        }

        await _workflowService.MarkCompletedAsync(quoteId, "current");
        var updated = await _quoteRepository.GetByIdWithDetailsAsync(quoteId);
        return Ok(updated);
    }

    [HttpPost("{quoteId:guid}/close")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Quote>> Close(Guid quoteId)
    {
        var quote = await _quoteRepository.GetByIdAsync(quoteId);
        if (quote is null)
        {
            return NotFound();
        }

        await _workflowService.CloseAsync(quoteId, "current");
        var updated = await _quoteRepository.GetByIdWithDetailsAsync(quoteId);
        return Ok(updated);
    }

    [HttpPost("{quoteId:guid}/handle-exception")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Quote>> HandleException(Guid quoteId, [FromBody] WorkflowReasonDto dto)
    {
        var quote = await _quoteRepository.GetByIdAsync(quoteId);
        if (quote is null)
        {
            return NotFound();
        }

        await _workflowService.HandleAmountExceptionAsync(quoteId, dto.Reason ?? string.Empty, "current");
        var updated = await _quoteRepository.GetByIdWithDetailsAsync(quoteId);
        return Ok(updated);
    }

    [HttpGet("{quoteId:guid}/history")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IEnumerable<StatusHistoryDto>>> GetHistory(Guid quoteId)
    {
        var quote = await _quoteRepository.GetByIdAsync(quoteId);
        if (quote is null)
        {
            return NotFound();
        }

        var history = await _statusHistoryRepository.FindAsync(sh => sh.QuoteId == quoteId);
        var historyDtos = history
            .OrderByDescending(sh => sh.ChangedAt)
            .Select(sh => sh.ToDto())
            .ToList();

        return Ok(historyDtos);
    }
}
