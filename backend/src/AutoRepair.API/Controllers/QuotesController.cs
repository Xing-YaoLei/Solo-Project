using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using AutoRepair.Application.DTOs;
using AutoRepair.Application.Interfaces;
using AutoRepair.Domain.Entities;

namespace AutoRepair.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class QuotesController : ControllerBase
{
    private readonly IQuoteService _quoteService;

    public QuotesController(IQuoteService quoteService)
    {
        _quoteService = quoteService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<QuoteDto>>> GetAll([FromQuery] Guid? workOrderId)
    {
        var quotes = await _quoteService.GetAllAsync(workOrderId);
        return Ok(quotes);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<QuoteDto>> GetById([FromRoute] Guid id)
    {
        var quote = await _quoteService.GetByIdAsync(id);
        if (quote == null)
        {
            return NotFound();
        }
        return Ok(quote);
    }

    [HttpPost]
    public async Task<ActionResult<QuoteDto>> Create([FromBody] QuoteCreateDto dto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }
        var quote = await _quoteService.CreateAsync(dto, userId);
        return CreatedAtAction(nameof(GetById), new { id = quote.Id }, quote);
    }

    [HttpPut("{id}/status")]
    public async Task<ActionResult<QuoteDto>> UpdateStatus([FromRoute] Guid id, [FromBody] QuoteStatus status)
    {
        var quote = await _quoteService.UpdateStatusAsync(id, status);
        if (quote == null)
        {
            return NotFound();
        }
        return Ok(quote);
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "RequireManager")]
    public async Task<IActionResult> Delete([FromRoute] Guid id)
    {
        var result = await _quoteService.DeleteAsync(id);
        if (!result)
        {
            return NotFound();
        }
        return NoContent();
    }
}
