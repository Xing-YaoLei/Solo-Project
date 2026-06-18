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
public class WorkOrdersController : ControllerBase
{
    private readonly IWorkOrderService _workOrderService;

    public WorkOrdersController(IWorkOrderService workOrderService)
    {
        _workOrderService = workOrderService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<WorkOrderDto>>> GetAll([FromQuery] DateTime? date, [FromQuery] string? userId)
    {
        string? currentUserId = null;
        if (User.IsInRole("Technician"))
        {
            currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        }
        else
        {
            currentUserId = userId;
        }

        var workOrders = await _workOrderService.GetAllAsync(currentUserId, date);
        return Ok(workOrders);
    }

    [HttpGet("daily")]
    public async Task<ActionResult<IEnumerable<WorkOrderDto>>> GetDailySchedule([FromQuery] DateTime? date)
    {
        var targetDate = date ?? DateTime.Today;

        string? userId = null;
        if (User.IsInRole("Technician"))
        {
            userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        }

        var workOrders = await _workOrderService.GetDailyScheduleAsync(targetDate, userId);
        return Ok(workOrders);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<WorkOrderDto>> GetById([FromRoute] Guid id)
    {
        var workOrder = await _workOrderService.GetByIdAsync(id);
        if (workOrder == null)
        {
            return NotFound();
        }
        return Ok(workOrder);
    }

    [HttpPost]
    public async Task<ActionResult<WorkOrderDto>> Create([FromBody] WorkOrderCreateDto dto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }
        var workOrder = await _workOrderService.CreateAsync(dto, userId);
        return CreatedAtAction(nameof(GetById), new { id = workOrder.Id }, workOrder);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<WorkOrderDto>> Update([FromRoute] Guid id, [FromBody] WorkOrderUpdateDto dto)
    {
        var workOrder = await _workOrderService.UpdateAsync(id, dto);
        if (workOrder == null)
        {
            return NotFound();
        }
        return Ok(workOrder);
    }

    [HttpPut("{id}/status")]
    public async Task<ActionResult<WorkOrderDto>> UpdateStatus([FromRoute] Guid id, [FromBody] UpdateWorkOrderStatusRequest request)
    {
        if (request == null) return BadRequest();
        var workOrder = await _workOrderService.UpdateStatusAsync(id, request.Status);
        if (workOrder == null)
        {
            return NotFound();
        }
        return Ok(workOrder);
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "RequireManager")]
    public async Task<IActionResult> Delete([FromRoute] Guid id)
    {
        var result = await _workOrderService.DeleteAsync(id);
        if (!result)
        {
            return NotFound();
        }
        return NoContent();
    }
}
