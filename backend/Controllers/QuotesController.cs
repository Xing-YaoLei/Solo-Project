using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using CarServiceAppointment.API.DTOs;
using CarServiceAppointment.API.Services;

namespace CarServiceAppointment.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[SwaggerTag("报价单管理")]
public class QuotesController : ControllerBase
{
    private readonly IQuoteService _quoteService;

    public QuotesController(IQuoteService quoteService)
    {
        _quoteService = quoteService;
    }

    [HttpGet("{id}")]
    [SwaggerOperation(Summary = "获取报价单详情")]
    public async Task<ActionResult<QuoteDto>> GetById(int id)
    {
        try
        {
            var result = await _quoteService.GetByIdAsync(id);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpGet("appointment/{appointmentId}")]
    [SwaggerOperation(Summary = "获取预约单的所有报价单")]
    public async Task<ActionResult<List<QuoteDto>>> GetByAppointmentId(int appointmentId)
    {
        var result = await _quoteService.GetByAppointmentIdAsync(appointmentId);
        return Ok(result);
    }

    [HttpPost]
    [SwaggerOperation(Summary = "创建报价单")]
    public async Task<ActionResult<QuoteDto>> Create([FromBody] CreateQuoteDto dto)
    {
        try
        {
            var result = await _quoteService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpPut("{id}")]
    [SwaggerOperation(Summary = "更新报价单")]
    public async Task<ActionResult<QuoteDto>> Update(int id, [FromBody] UpdateQuoteDto dto)
    {
        try
        {
            var result = await _quoteService.UpdateAsync(id, dto);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{id}/confirm")]
    [SwaggerOperation(Summary = "确认报价单")]
    public async Task<ActionResult<QuoteDto>> Confirm(int id)
    {
        try
        {
            var result = await _quoteService.ConfirmAsync(id);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{id}/reject")]
    [SwaggerOperation(Summary = "拒绝报价单")]
    public async Task<ActionResult<QuoteDto>> Reject(int id)
    {
        try
        {
            var result = await _quoteService.RejectAsync(id);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpDelete("{id}")]
    [SwaggerOperation(Summary = "删除报价单")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await _quoteService.DeleteAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
