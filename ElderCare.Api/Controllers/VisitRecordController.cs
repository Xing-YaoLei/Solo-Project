using ElderCare.Api.DTOs;
using ElderCare.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace ElderCare.Api.Controllers;

[ApiController]
[Route("api/visit-records")]
public class VisitRecordController : ControllerBase
{
    private readonly IVisitService _service;

    public VisitRecordController(IVisitService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<VisitRecordDto>>> GetAll()
    {
        var result = await _service.GetAllVisitRecordsAsync();
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<VisitRecordDto>> Create(CreateVisitRecordDto dto)
    {
        var result = await _service.CreateVisitRecordAsync(dto);
        return CreatedAtAction(nameof(GetAll), new { id = result.Id }, result);
    }

    [HttpGet("elderly/{elderlyId}")]
    public async Task<ActionResult<IEnumerable<VisitRecordDto>>> GetByElderly(int elderlyId)
    {
        var result = await _service.GetVisitsByElderlyAsync(elderlyId);
        return Ok(result);
    }

    [HttpGet("compliance")]
    public async Task<ActionResult<IEnumerable<VisitComplianceDto>>> GetCompliance(
        [FromQuery] int? staffId = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        var result = await _service.GetComplianceAsync(staffId, startDate, endDate);
        return Ok(result);
    }
}
