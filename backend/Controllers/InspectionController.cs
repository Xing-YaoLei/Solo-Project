using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using CarServiceAppointment.API.DTOs;
using CarServiceAppointment.API.Services;
using CarServiceAppointment.API.Models;

namespace CarServiceAppointment.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[SwaggerTag("质检照片管理")]
public class InspectionController : ControllerBase
{
    private readonly IInspectionService _inspectionService;

    public InspectionController(IInspectionService inspectionService)
    {
        _inspectionService = inspectionService;
    }

    [HttpGet("{id}")]
    [SwaggerOperation(Summary = "获取质检照片详情")]
    public async Task<ActionResult<InspectionPhotoDto>> GetById(int id)
    {
        try
        {
            var result = await _inspectionService.GetByIdAsync(id);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpGet("appointment/{appointmentId}")]
    [SwaggerOperation(Summary = "获取预约单的质检照片")]
    public async Task<ActionResult<List<InspectionPhotoDto>>> GetByAppointmentId(int appointmentId, [FromQuery] PhotoType? photoType = null)
    {
        var result = await _inspectionService.GetByAppointmentIdAsync(appointmentId, photoType);
        return Ok(result);
    }

    [HttpPost]
    [SwaggerOperation(Summary = "上传质检照片")]
    public async Task<ActionResult<InspectionPhotoDto>> Upload([FromBody] UploadPhotoDto dto)
    {
        try
        {
            var result = await _inspectionService.UploadAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpDelete("{id}")]
    [SwaggerOperation(Summary = "删除质检照片")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await _inspectionService.DeleteAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }
}
