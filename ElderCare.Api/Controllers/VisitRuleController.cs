using ElderCare.Api.DTOs;
using ElderCare.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace ElderCare.Api.Controllers;

[ApiController]
[Route("api/visit-rules")]
public class VisitRuleController : ControllerBase
{
    private readonly IVisitService _service;

    public VisitRuleController(IVisitService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<VisitRuleDto>>> GetAll()
    {
        var result = await _service.GetAllRulesAsync();
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<VisitRuleDto>> Create(CreateVisitRuleDto dto)
    {
        var result = await _service.CreateRuleAsync(dto);
        return CreatedAtAction(nameof(GetAll), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<VisitRuleDto>> Update(int id, CreateVisitRuleDto dto)
    {
        var result = await _service.UpdateRuleAsync(id, dto);
        if (result == null) return NotFound();
        return Ok(result);
    }
}
