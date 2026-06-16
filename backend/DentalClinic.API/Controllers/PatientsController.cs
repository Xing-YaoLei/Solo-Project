using DentalClinic.API.DTOs;
using DentalClinic.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace DentalClinic.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PatientsController : ControllerBase
{
    private readonly IPatientService _patientService;

    public PatientsController(IPatientService patientService)
    {
        _patientService = patientService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PatientSummaryDto>>> GetPatients(
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var patients = await _patientService.GetPatientsAsync(search, page, pageSize);
        var total = await _patientService.GetPatientCountAsync(search);

        Response.Headers.Add("X-Total-Count", total.ToString());
        return Ok(patients);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<PatientDto>> GetPatient(int id)
    {
        var patient = await _patientService.GetPatientByIdAsync(id);
        if (patient == null) return NotFound();
        return Ok(patient);
    }

    [HttpGet("{id}/summary")]
    public async Task<ActionResult<PatientSummaryDto>> GetPatientSummary(int id)
    {
        var summary = await _patientService.GetPatientSummaryAsync(id);
        if (summary == null) return NotFound();
        return Ok(summary);
    }

    [HttpPost]
    public async Task<ActionResult<PatientDto>> CreatePatient([FromBody] CreatePatientDto dto)
    {
        var patient = await _patientService.CreatePatientAsync(dto);
        return CreatedAtAction(nameof(GetPatient), new { id = patient.Id }, patient);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<PatientDto>> UpdatePatient(int id, [FromBody] UpdatePatientDto dto)
    {
        var patient = await _patientService.UpdatePatientAsync(id, dto);
        if (patient == null) return NotFound();
        return Ok(patient);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePatient(int id)
    {
        var result = await _patientService.DeletePatientAsync(id);
        if (!result) return NotFound();
        return NoContent();
    }
}
