using LegalFeeScheduling.Domain.DTOs;
using LegalFeeScheduling.Domain.Entities;
using LegalFeeScheduling.Domain.Enums;
using LegalFeeScheduling.Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
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
    public async Task<ActionResult<IEnumerable<ReconciliationRecord>>> Get([FromQuery] Guid? quoteId)
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
    public async Task<ActionResult<ReconciliationRecord>> Create([FromBody] ReconciliationCreateDto dto)
    {
        var quote = await _quoteRepository.GetByIdAsync(dto.QuoteId);
        if (quote is null)
        {
            return NotFound(new { message = "报价单不存在" });
        }

        var record = dto.ToEntity();
        record.Difference = dto.ExpectedAmount - dto.ActualAmount;
        record.Status = Math.Abs(record.Difference) < 0.01m
            ? ReconciliationStatus.Matched
            : ReconciliationStatus.Mismatched;

        var created = await _reconciliationRepository.CreateReconciliationAsync(record);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ReconciliationRecord>> Update(Guid id, [FromBody] ReconciliationUpdateDto dto)
    {
        var existing = await _reconciliationRepository.GetByIdAsync(id);
        if (existing is null)
        {
            return NotFound();
        }

        dto.UpdateEntity(existing);
        existing.UpdatedAt = DateTime.UtcNow;

        await _reconciliationRepository.UpdateAsync(existing);
        return Ok(existing);
    }

    [HttpPost("{id:guid}/resolve")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ReconciliationRecord>> Resolve(Guid id, [FromBody] ReconciliationResolveDto dto)
    {
        var existing = await _reconciliationRepository.GetByIdAsync(id);
        if (existing is null)
        {
            return NotFound();
        }

        existing.Status = ReconciliationStatus.Resolved;
        existing.ResolvedAt = DateTime.UtcNow;
        existing.ResolvedBy = "current";
        existing.Remarks = dto.Remarks;
        existing.UpdatedAt = DateTime.UtcNow;

        await _reconciliationRepository.UpdateAsync(existing);
        return Ok(existing);
    }
}
