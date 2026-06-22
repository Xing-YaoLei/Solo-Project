using LegalFeeScheduling.Domain.DTOs;
using LegalFeeScheduling.Domain.Entities;
using LegalFeeScheduling.Domain.Enums;
using LegalFeeScheduling.Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace LegalFeeScheduling.API.Controllers;

[ApiController]
[Route("api/payments")]
[Produces("application/json")]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentRepository _paymentRepository;
    private readonly IQuoteRepository _quoteRepository;

    public PaymentsController(
        IPaymentRepository paymentRepository,
        IQuoteRepository quoteRepository)
    {
        _paymentRepository = paymentRepository;
        _quoteRepository = quoteRepository;
    }

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<PaymentRecord>>> Get([FromQuery] Guid? quoteId)
    {
        IEnumerable<PaymentRecord> payments;
        if (quoteId.HasValue)
        {
            payments = await _paymentRepository.GetByQuoteIdAsync(quoteId.Value);
        }
        else
        {
            payments = await _paymentRepository.GetAllAsync();
        }
        return Ok(payments);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PaymentRecord>> GetById(Guid id)
    {
        var payment = await _paymentRepository.GetByIdAsync(id);
        if (payment is null)
        {
            return NotFound();
        }
        return Ok(payment);
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PaymentRecord>> Create([FromBody] PaymentCreateDto dto)
    {
        var quote = await _quoteRepository.GetByIdAsync(dto.QuoteId);
        if (quote is null)
        {
            return NotFound(new { message = "报价单不存在" });
        }

        var payment = dto.ToEntity();
        payment.PaymentNo = GeneratePaymentNo();
        payment.CreatedBy = "current";
        payment.Status = PaymentStatus.Paid;

        var created = await _paymentRepository.CreatePaymentAsync(payment);

        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PaymentRecord>> Update(Guid id, [FromBody] PaymentUpdateDto dto)
    {
        var existing = await _paymentRepository.GetByIdAsync(id);
        if (existing is null)
        {
            return NotFound();
        }

        dto.UpdateEntity(existing);
        existing.UpdatedAt = DateTime.UtcNow;

        await _paymentRepository.UpdateAsync(existing);

        return Ok(existing);
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> Delete(Guid id)
    {
        var payment = await _paymentRepository.GetByIdAsync(id);
        if (payment is null)
        {
            return NotFound();
        }

        await _paymentRepository.DeleteAsync(id);
        return NoContent();
    }

    private string GeneratePaymentNo()
    {
        var datePart = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
        var randomPart = Guid.NewGuid().ToString("N").Substring(0, 6).ToUpper();
        return $"PAY{datePart}{randomPart}";
    }
}
