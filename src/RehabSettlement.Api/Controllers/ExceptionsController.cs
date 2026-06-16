using Microsoft.AspNetCore.Mvc;
using RehabSettlement.Api.Dtos;
using RehabSettlement.Api.Services;

namespace RehabSettlement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ExceptionsController : ControllerBase
{
    private readonly IExceptionService _service;

    public ExceptionsController(IExceptionService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<List<ExceptionRecordDto>>> GetList(
        [FromQuery] int? billId = null, 
        [FromQuery] bool? isClosed = null)
    {
        var result = await _service.GetExceptionRecordsAsync(billId, isClosed);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ExceptionRecordDto>> GetById(int id)
    {
        var result = await _service.GetExceptionRecordByIdAsync(id);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<ExceptionRecordDto>> Create([FromBody] CreateExceptionRecordDto dto)
    {
        var result = await _service.CreateExceptionRecordAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPost("handle")]
    public async Task<ActionResult<ExceptionRecordDto>> Handle([FromBody] HandleExceptionDto dto)
    {
        var result = await _service.HandleExceptionAsync(dto);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost("close")]
    public async Task<ActionResult<ExceptionRecordDto>> Close([FromBody] CloseExceptionDto dto)
    {
        var result = await _service.CloseExceptionAsync(dto);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost("{exceptionId}/supplement-materials")]
    public async Task<ActionResult<SupplementMaterialDto>> AddSupplementMaterial(
        int exceptionId, 
        [FromBody] CreateSupplementMaterialDto dto,
        [FromQuery] int billId)
    {
        var result = await _service.AddSupplementMaterialAsync(dto, exceptionId, billId);
        return Ok(result);
    }
}
