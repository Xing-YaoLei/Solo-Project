using System.Security.Claims;
using HomeImprovementPlatform.API.DTOs.Payment;
using HomeImprovementPlatform.API.Enums;
using HomeImprovementPlatform.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HomeImprovementPlatform.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;

    public PaymentsController(IPaymentService paymentService)
    {
        _paymentService = paymentService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PaymentRecordDto>>> GetAll(
        [FromQuery] PaymentStatus? status,
        [FromQuery] Guid? projectId)
    {
        var payments = await _paymentService.GetAllAsync(status, projectId);
        return Ok(payments);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<PaymentRecordDto>> GetById(Guid id)
    {
        try
        {
            var payment = await _paymentService.GetByIdAsync(id);
            return Ok(payment);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost]
    [Authorize(Roles = "Supervisor,Designer")]
    public async Task<ActionResult<PaymentRecordDto>> Create([FromBody] CreatePaymentDto dto)
    {
        var userId = GetCurrentUserId();
        var payment = await _paymentService.CreateAsync(dto, userId);
        return CreatedAtAction(nameof(GetById), new { id = payment.Id }, payment);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Supervisor,Designer")]
    public async Task<ActionResult<PaymentRecordDto>> Update(Guid id, [FromBody] UpdatePaymentDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();
            var payment = await _paymentService.UpdateAsync(id, dto, userId);
            return Ok(payment);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Supervisor")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            await _paymentService.DeleteAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : Guid.Empty;
    }
}
