using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using AutoRepair.Application.DTOs;
using AutoRepair.Application.Interfaces;

namespace AutoRepair.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class DiagnosesController : ControllerBase
{
    private readonly IDiagnosisService _diagnosisService;

    public DiagnosesController(IDiagnosisService diagnosisService)
    {
        _diagnosisService = diagnosisService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<DiagnosisDto>>> GetAll([FromQuery] Guid? vehicleId, [FromQuery] Guid? workOrderId)
    {
        var diagnoses = await _diagnosisService.GetAllAsync(vehicleId, workOrderId);
        return Ok(diagnoses);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<DiagnosisDto>> GetById([FromRoute] Guid id)
    {
        var diagnosis = await _diagnosisService.GetByIdAsync(id);
        if (diagnosis == null)
        {
            return NotFound();
        }
        return Ok(diagnosis);
    }

    [HttpPost]
    public async Task<ActionResult<DiagnosisDto>> Create([FromBody] DiagnosisCreateDto dto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }
        var diagnosis = await _diagnosisService.CreateAsync(dto, userId);
        return CreatedAtAction(nameof(GetById), new { id = diagnosis.Id }, diagnosis);
    }
}
