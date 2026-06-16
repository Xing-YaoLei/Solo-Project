using DentalClinic.API.DTOs;
using DentalClinic.API.Enums;
using DentalClinic.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace DentalClinic.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AppointmentsController : ControllerBase
{
    private readonly IAppointmentService _appointmentService;

    public AppointmentsController(IAppointmentService appointmentService)
    {
        _appointmentService = appointmentService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AppointmentListDto>>> GetAppointments(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] AppointmentStatus? status = null,
        [FromQuery] int? patientId = null,
        [FromQuery] RiskLevel? riskLevel = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var appointments = await _appointmentService.GetAppointmentsAsync(
            startDate, endDate, status, patientId, riskLevel, page, pageSize);

        var total = await _appointmentService.GetAppointmentCountAsync(
            startDate, endDate, status, patientId, riskLevel);

        Response.Headers.Add("X-Total-Count", total.ToString());
        return Ok(appointments);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<AppointmentDetailDto>> GetAppointment(int id)
    {
        var appointment = await _appointmentService.GetAppointmentByIdAsync(id);
        if (appointment == null) return NotFound();
        return Ok(appointment);
    }

    [HttpPost]
    public async Task<ActionResult<AppointmentDto>> CreateAppointment([FromBody] CreateAppointmentDto dto)
    {
        var appointment = await _appointmentService.CreateAppointmentAsync(dto);
        return CreatedAtAction(nameof(GetAppointment), new { id = appointment.Id }, appointment);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<AppointmentDto>> UpdateAppointment(int id, [FromBody] UpdateAppointmentDto dto)
    {
        var appointment = await _appointmentService.UpdateAppointmentAsync(id, dto);
        if (appointment == null) return NotFound();
        return Ok(appointment);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAppointment(int id)
    {
        var result = await _appointmentService.DeleteAppointmentAsync(id);
        if (!result) return NotFound();
        return NoContent();
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromQuery] AppointmentStatus status)
    {
        var result = await _appointmentService.UpdateAppointmentStatusAsync(id, status);
        if (!result) return NotFound();
        return NoContent();
    }

    [HttpGet("no-show")]
    public async Task<ActionResult<IEnumerable<NoShowAppointmentDto>>> GetNoShowAppointments(
        [FromQuery] RiskLevel? minRiskLevel = null)
    {
        var noShows = await _appointmentService.GetNoShowAppointmentsAsync(minRiskLevel);
        return Ok(noShows);
    }

    [HttpPut("{id}/communication-notes")]
    public async Task<IActionResult> UpdateCommunicationNotes(int id, [FromBody] string notes)
    {
        var result = await _appointmentService.UpdateCommunicationNotesAsync(id, notes);
        if (!result) return NotFound();
        return NoContent();
    }

    [HttpPut("{id}/review-comments")]
    public async Task<IActionResult> UpdateReviewComments(int id, [FromBody] string comments)
    {
        var result = await _appointmentService.UpdateReviewCommentsAsync(id, comments);
        if (!result) return NotFound();
        return NoContent();
    }
}
