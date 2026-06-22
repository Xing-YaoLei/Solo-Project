using LegalFeeScheduling.Domain.DTOs;
using LegalFeeScheduling.Domain.Entities;
using LegalFeeScheduling.Domain.Enums;
using LegalFeeScheduling.Infrastructure.Repositories;
using LegalFeeScheduling.Infrastructure.Services;
using Microsoft.AspNetCore.Http;
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
    public async Task<ActionResult<PagedResultDto<Quote>>> GetList(
        [FromQuery] QuoteListFilterDto filter)
    {
        var (items, totalCount) = await _quoteRepository.GetListAsync(
            filter.Status,
            filter.Channel,
            filter.Owner,
            filter.StartDate,
            filter.EndDate,
            filter.Keyword,
            filter.Page,
            filter.PageSize);

        return Ok(items.ToPagedResult(totalCount, filter.Page, filter.PageSize));
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
    public async Task<ActionResult<Quote>> Create([FromBody] QuoteCreateDto dto)
    {
        var quote = dto.ToEntity();
        quote.QuoteNo = GenerateQuoteNo();
        quote.Status = QuoteStatus.Draft;
        quote.CreatedBy = "current";

        if (quote.Items != null)
        {
            foreach (var item in quote.Items)
            {
                item.QuoteId = quote.Id;
                item.Subtotal = item.UnitPrice * item.Quantity;
                item.CreatedAt = DateTime.UtcNow;
                item.UpdatedAt = DateTime.UtcNow;
            }
            quote.FinalAmount = dto.Amount - dto.DiscountAmount;
        }

        var created = await _quoteRepository.AddAsync(quote);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Quote>> Update(Guid id, [FromBody] QuoteUpdateDto dto)
    {
        var existing = await _quoteRepository.GetByIdWithDetailsAsync(id);
        if (existing is null)
        {
            return NotFound();
        }

        dto.UpdateEntity(existing);
        existing.UpdatedAt = DateTime.UtcNow;

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
    public async Task<ActionResult<QuoteItem>> AddItem(Guid id, [FromBody] QuoteItemCreateDto dto)
    {
        var quote = await _quoteRepository.GetByIdAsync(id);
        if (quote is null)
        {
            return NotFound();
        }

        var item = dto.ToEntity();
        item.QuoteId = id;
        item.Subtotal = dto.UnitPrice * dto.Quantity;

        var created = await _quoteItemRepository.AddAsync(item);
        return CreatedAtAction(nameof(GetById), new { id }, created);
    }

    [HttpPut("{id:guid}/items/{itemId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<QuoteItem>> UpdateItem(Guid id, Guid itemId, [FromBody] QuoteItemUpdateDto dto)
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

        existing.ItemName = dto.ItemName;
        existing.Description = dto.Description;
        existing.UnitPrice = dto.UnitPrice;
        existing.Quantity = dto.Quantity;
        existing.Subtotal = dto.UnitPrice * dto.Quantity;
        existing.UpdatedAt = DateTime.UtcNow;

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
    public async Task<ActionResult<IEnumerable<AmountCheckResult>>> ValidateAmounts(Guid id)
    {
        var quote = await _quoteRepository.GetByIdAsync(id);
        if (quote is null)
        {
            return NotFound();
        }

        var quoteCheck = await _amountValidationService.ValidateQuoteAmountsAsync(id, "current");
        var paymentCheck = await _amountValidationService.ValidatePaymentsVsReconciliationAsync(id, "current");

        return Ok(new[] { quoteCheck, paymentCheck });
    }

    private string GenerateQuoteNo()
    {
        var datePart = DateTime.UtcNow.ToString("yyyyMMdd");
        var randomPart = Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper();
        return $"LF{datePart}{randomPart}";
    }
}
