using ElderCare.Api.DTOs;
using ElderCare.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace ElderCare.Api.Controllers;

[ApiController]
[Route("api/elderly")]
public class ElderlyProfileController : ControllerBase
{
    private readonly IElderlyService _service;

    public ElderlyProfileController(IElderlyService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ElderlyDto>>> GetAll()
    {
        var result = await _service.GetAllAsync();
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ElderlyDto>> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<ElderlyDto>> Create(CreateElderlyDto dto)
    {
        var result = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ElderlyDto>> Update(int id, UpdateElderlyDto dto)
    {
        var result = await _service.UpdateAsync(id, dto);
        if (result == null) return NotFound();
        return Ok(result);
    }
}
