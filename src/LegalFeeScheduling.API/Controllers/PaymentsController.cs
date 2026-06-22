using LegalFeeScheduling.Domain.Entities;
using LegalFeeScheduling.Infrastructure.Repositories;
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
    public async Task<ActionResult<IEnumerable<PaymentRecord>>> GetByQuoteId([FromQuery] Guid? quoteId = null)
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
    public async Task<ActionResult<PaymentRecord>> Create([FromBody] PaymentRecord payment)
    {
        var quote = await _quoteRepository.GetByIdAsync(payment.QuoteId);
        if (quote is null)
        {
            return NotFound(new { message = "报价单不存在" });
        }

        payment.Id = Guid.NewGuid();
        payment.CreatedAt = DateTime.UtcNow;
        payment.UpdatedAt = DateTime.UtcNow;
        payment.PaymentNo = $"PAY-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}";

        var created = await _paymentRepository.AddAsync(payment);

        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PaymentRecord>> Update(Guid id, [FromBody] PaymentRecord payment)
    {
        var existing = await _paymentRepository.GetByIdAsync(id);
        if (existing is null)
        {
            return NotFound();
        }

        existing.Amount = payment.Amount;
        existing.PaymentDate = payment.PaymentDate;
        existing.PaymentMethod = payment.PaymentMethod;
        existing.Status = payment.Status;
        existing.BankTransactionNo = payment.BankTransactionNo;
        existing.Payer = payment.Payer;
        existing.Remarks = payment.Remarks;

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
}
