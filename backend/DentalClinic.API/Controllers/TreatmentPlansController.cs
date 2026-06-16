using DentalClinic.API.DTOs;
using DentalClinic.API.Enums;
using DentalClinic.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace DentalClinic.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TreatmentPlansController : ControllerBase
{
    private readonly ITreatmentPlanService _treatmentPlanService;

    public TreatmentPlansController(ITreatmentPlanService treatmentPlanService)
    {
        _treatmentPlanService = treatmentPlanService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TreatmentPlanDto>>> GetTreatmentPlans(
        [FromQuery] int? patientId = null,
        [FromQuery] TreatmentStatus? status = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var plans = await _treatmentPlanService.GetTreatmentPlansAsync(patientId, status, page, pageSize);
        var total = await _treatmentPlanService.GetTreatmentPlanCountAsync(patientId, status);

        Response.Headers.Add("X-Total-Count", total.ToString());
        return Ok(plans);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TreatmentPlanDto>> GetTreatmentPlan(int id)
    {
        var plan = await _treatmentPlanService.GetTreatmentPlanByIdAsync(id);
        if (plan == null) return NotFound();
        return Ok(plan);
    }

    [HttpPost]
    public async Task<ActionResult<TreatmentPlanDto>> CreateTreatmentPlan([FromBody] CreateTreatmentPlanDto dto)
    {
        var plan = await _treatmentPlanService.CreateTreatmentPlanAsync(dto);
        return CreatedAtAction(nameof(GetTreatmentPlan), new { id = plan.Id }, plan);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<TreatmentPlanDto>> UpdateTreatmentPlan(int id, [FromBody] UpdateTreatmentPlanDto dto)
    {
        var plan = await _treatmentPlanService.UpdateTreatmentPlanAsync(id, dto);
        if (plan == null) return NotFound();
        return Ok(plan);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTreatmentPlan(int id)
    {
        var result = await _treatmentPlanService.DeleteTreatmentPlanAsync(id);
        if (!result) return NotFound();
        return NoContent();
    }

    [HttpPut("items/{itemId}/status")]
    public async Task<IActionResult> UpdatePlanItemStatus(int itemId, [FromQuery] bool isCompleted)
    {
        var result = await _treatmentPlanService.UpdatePlanItemStatusAsync(itemId, isCompleted);
        if (!result) return NotFound();
        return NoContent();
    }
}
