using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using AutoRepair.Application.DTOs;
using AutoRepair.Application.Interfaces;

namespace AutoRepair.API.Controllers;

[Route("api/communication-logs")]
[ApiController]
[Authorize]
public class CommunicationLogsController : ControllerBase
{
    private readonly ICommunicationLogService _communicationLogService;

    public CommunicationLogsController(ICommunicationLogService communicationLogService)
    {
        _communicationLogService = communicationLogService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CommunicationLogDto>>> GetByEntity([FromQuery] Guid? stockAlertId, [FromQuery] Guid? quoteId, [FromQuery] Guid? workOrderId)
    {
        var logs = await _communicationLogService.GetByEntityAsync(stockAlertId, quoteId, workOrderId);
        return Ok(logs);
    }

    [HttpPost]
    public async Task<ActionResult<CommunicationLogDto>> Create([FromBody] CommunicationLogCreateDto dto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }
        var log = await _communicationLogService.CreateAsync(dto, userId);
        return Ok(log);
    }
}
