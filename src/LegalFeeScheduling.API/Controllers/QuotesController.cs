using LegalFeeScheduling.Domain.Entities;
using LegalFeeScheduling.Domain.Enums;
using LegalFeeScheduling.Infrastructure.Repositories;
using LegalFeeScheduling.Infrastructure.Services;
using Microsoft.AspNetCore.Mvc;

namespace LegalFeeScheduling.API.Controllers;

[ApiController]
[Route("api/quotes")]
[Produces("application/json")]
public class QuotesController : ControllerBase
{
    private readonly IQuoteRepository _quoteRepository;
    private readonly IRepository<QuoteItem> _quoteItemRepository;
    private readonly IAmountValidationService _amountValidationService;

    public QuotesController(
        IQuoteRepository quoteRepository,
        IRepository<QuoteItem> quoteItemRepository,
        IAmountValidationService amountValidationService)
    {
        _quoteRepository = quoteRepository;
        _quoteItemRepository = quoteItemRepository;
        _amountValidationService = amountValidationService;
    }

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<object>> GetList(
        [FromQuery] QuoteStatus? status = null,
        [FromQuery] Channel? channel = null,
        [FromQuery] string? owner = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] string? keyword = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var (items, totalCount) = await _quoteRepository.GetListAsync(
            status, channel, owner, startDate, endDate, keyword, page, pageSize);

        return Ok(new
        {
            items,
            totalCount,
            page,
            pageSize
        });
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Quote>> GetById(Guid id)
    {
        var quote = await _quoteRepository.GetByIdWithDetailsAsync(id);
        if (quote is null)
        {
            return NotFound();
        }
        return Ok(quote);
    }

    [HttpGet("no/{quoteNo}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Quote>> GetByQuoteNo(string quoteNo)
    {
        var quote = await _quoteRepository.GetByQuoteNoAsync(quoteNo);
        if (quote is null)
        {
            return NotFound();
        }
        return Ok(quote);
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<Quote>> Create([FromBody] Quote quote)
    {
        quote.Id = Guid.NewGuid();
        quote.Status = QuoteStatus.Draft;
        quote.CreatedAt = DateTime.UtcNow;
        quote.UpdatedAt = DateTime.UtcNow;

        if (quote.Items != null)
        {
            foreach (var item in quote.Items)
            {
                item.Id = Guid.NewGuid();
                item.QuoteId = quote.Id;
                item.CreatedAt = DateTime.UtcNow;
                item.UpdatedAt = DateTime.UtcNow;
                item.Subtotal = item.UnitPrice * item.Quantity;
            }
        }

        var created = await _quoteRepository.AddAsync(quote);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Quote>> Update(Guid id, [FromBody] Quote quote)
    {
        var existing = await _quoteRepository.GetByIdAsync(id);
        if (existing is null)
        {
            return NotFound();
        }

        existing.CaseName = quote.CaseName;
        existing.ClientName = quote.ClientName;
        existing.Channel = quote.Channel;
        existing.Amount = quote.Amount;
        existing.DiscountAmount = quote.DiscountAmount;
        existing.FinalAmount = quote.FinalAmount;
        existing.Remarks = quote.Remarks;
        existing.ExpectedPaymentDate = quote.ExpectedPaymentDate;
        existing.Owner = quote.Owner;

        await _quoteRepository.UpdateAsync(existing);
        return Ok(existing);
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult> Delete(Guid id)
    {
        var quote = await _quoteRepository.GetByIdAsync(id);
        if (quote is null)
        {
            return NotFound();
        }

        if (quote.Status != QuoteStatus.Draft)
        {
            return BadRequest(new { message = "只有草稿状态的报价单可以删除" });
        }

        await _quoteRepository.DeleteAsync(id);
        return NoContent();
    }

    [HttpPost("{id:guid}/items")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<QuoteItem>> AddItem(Guid id, [FromBody] QuoteItem item)
    {
        var quote = await _quoteRepository.GetByIdAsync(id);
        if (quote is null)
        {
            return NotFound();
        }

        item.Id = Guid.NewGuid();
        item.QuoteId = id;
        item.CreatedAt = DateTime.UtcNow;
        item.UpdatedAt = DateTime.UtcNow;
        item.Subtotal = item.UnitPrice * item.Quantity;

        var created = await _quoteItemRepository.AddAsync(item);

        return CreatedAtAction(nameof(GetById), new { id }, created);
    }

    [HttpPut("{id:guid}/items/{itemId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<QuoteItem>> UpdateItem(Guid id, Guid itemId, [FromBody] QuoteItem item)
    {
        var quote = await _quoteRepository.GetByIdWithDetailsAsync(id);
        if (quote is null)
        {
            return NotFound();
        }

        var existing = quote.Items.FirstOrDefault(i => i.Id == itemId);
        if (existing is null)
        {
            return NotFound();
        }

        existing.ItemName = item.ItemName;
        existing.Description = item.Description;
        existing.UnitPrice = item.UnitPrice;
        existing.Quantity = item.Quantity;
        existing.Subtotal = item.UnitPrice * item.Quantity;

        await _quoteItemRepository.UpdateAsync(existing);

        return Ok(existing);
    }

    [HttpDelete("{id:guid}/items/{itemId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> DeleteItem(Guid id, Guid itemId)
    {
        var quote = await _quoteRepository.GetByIdWithDetailsAsync(id);
        if (quote is null)
        {
            return NotFound();
        }

        var item = quote.Items.FirstOrDefault(i => i.Id == itemId);
        if (item is null)
        {
            return NotFound();
        }

        await _quoteItemRepository.DeleteAsync(itemId);
        return NoContent();
    }

    [HttpGet("{id:guid}/validate-amounts")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AmountCheckResult>> ValidateAmounts(Guid id)
    {
        var quote = await _quoteRepository.GetByIdAsync(id);
        if (quote is null)
        {
            return NotFound();
        }

        var result = await _amountValidationService.ValidateQuoteAmountsAsync(id);
        return Ok(result);
    }
}
