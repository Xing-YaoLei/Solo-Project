using LegalFeeScheduling.Domain.Entities;
using LegalFeeScheduling.Domain.Enums;
using LegalFeeScheduling.Infrastructure.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace LegalFeeScheduling.API.Controllers;

[ApiController]
[Route("api/reconciliation")]
[Produces("application/json")]
public class ReconciliationController : ControllerBase
{
    private readonly IReconciliationRepository _reconciliationRepository;
    private readonly IQuoteRepository _quoteRepository;
    private readonly IPaymentRepository _paymentRepository;

    public ReconciliationController(
        IReconciliationRepository reconciliationRepository,
        IQuoteRepository quoteRepository,
        IPaymentRepository paymentRepository)
    {
        _reconciliationRepository = reconciliationRepository;
        _quoteRepository = quoteRepository;
        _paymentRepository = paymentRepository;
    }

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<ReconciliationRecord>>> GetByQuoteId([FromQuery] Guid? quoteId = null)
    {
        IEnumerable<ReconciliationRecord> records;
        if (quoteId.HasValue)
        {
            records = await _reconciliationRepository.GetByQuoteIdAsync(quoteId.Value);
        }
        else
        {
            records = await _reconciliationRepository.GetAllAsync();
        }
        return Ok(records);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ReconciliationRecord>> GetById(Guid id)
    {
        var record = await _reconciliationRepository.GetByIdAsync(id);
        if (record is null)
        {
            return NotFound();
        }
        return Ok(record);
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ReconciliationRecord>> Create([FromBody] ReconciliationRecord record)
    {
        var quote = await _quoteRepository.GetByIdAsync(record.QuoteId);
        if (quote is null)
        {
            return NotFound(new { message = "报价单不存在" });
        }

        record.Id = Guid.NewGuid();
        record.CreatedAt = DateTime.UtcNow;
        record.UpdatedAt = DateTime.UtcNow;
        record.ReconcileDate = DateTime.UtcNow;
        record.Difference = record.ExpectedAmount - record.ActualAmount;
        record.Status = Math.Abs(record.Difference) < 0.01m
            ? ReconciliationStatus.Matched
            : ReconciliationStatus.Mismatched;

        var created = await _reconciliationRepository.AddAsync(record);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ReconciliationRecord>> Update(Guid id, [FromBody] ReconciliationRecord record)
    {
        var existing = await _reconciliationRepository.GetByIdAsync(id);
        if (existing is null)
        {
            return NotFound();
        }

        existing.ExpectedAmount = record.ExpectedAmount;
        existing.ActualAmount = record.ActualAmount;
        existing.Difference = record.ExpectedAmount - record.ActualAmount;
        existing.Status = Math.Abs(existing.Difference) < 0.01m
            ? ReconciliationStatus.Matched
            : ReconciliationStatus.Mismatched;
        existing.Remarks = record.Remarks;

        if (existing.Status == ReconciliationStatus.Matched)
        {
            existing.Status = ReconciliationStatus.Resolved;
            existing.ResolvedAt = DateTime.UtcNow;
        }

        await _reconciliationRepository.UpdateAsync(existing);
        return Ok(existing);
    }

    [HttpPost("{id:guid}/resolve")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ReconciliationRecord>> Resolve(Guid id, [FromBody] object? body)
    {
        var existing = await _reconciliationRepository.GetByIdAsync(id);
        if (existing is null)
        {
            return NotFound();
        }

        existing.Status = ReconciliationStatus.Resolved;
        existing.ResolvedAt = DateTime.UtcNow;

        await _reconciliationRepository.UpdateAsync(existing);
        return Ok(existing);
    }
}
