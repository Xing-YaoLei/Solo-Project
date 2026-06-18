using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using AutoRepair.Application.DTOs;
using AutoRepair.Application.Interfaces;

namespace AutoRepair.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class StockAlertsController : ControllerBase
{
    private readonly IStockAlertService _stockAlertService;

    public StockAlertsController(IStockAlertService stockAlertService)
    {
        _stockAlertService = stockAlertService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<StockAlertDto>>> GetAll([FromQuery] bool? acknowledged)
    {
        var alerts = await _stockAlertService.GetAllAsync(acknowledged);
        return Ok(alerts);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<StockAlertDto>> GetById([FromRoute] Guid id)
    {
        var alert = await _stockAlertService.GetByIdAsync(id);
        if (alert == null)
        {
            return NotFound();
        }
        return Ok(alert);
    }

    [HttpPost("{id}/acknowledge")]
    public async Task<IActionResult> Acknowledge([FromRoute] Guid id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }
        await _stockAlertService.AcknowledgeAsync(id, userId);
        return NoContent();
    }
}
