using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AutoRepair.Application.DTOs;
using AutoRepair.Application.Interfaces;

namespace AutoRepair.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class PartsController : ControllerBase
{
    private readonly IPartService _partService;

    public PartsController(IPartService partService)
    {
        _partService = partService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PartDto>>> GetAll([FromQuery] string? category, [FromQuery] bool? lowStockOnly)
    {
        var parts = await _partService.GetAllAsync(category, lowStockOnly);
        return Ok(parts);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<PartDto>> GetById([FromRoute] Guid id)
    {
        var part = await _partService.GetByIdAsync(id);
        if (part == null)
        {
            return NotFound();
        }
        return Ok(part);
    }

    [HttpPost]
    public async Task<ActionResult<PartDto>> Create([FromBody] PartCreateDto dto)
    {
        var part = await _partService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = part.Id }, part);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<PartDto>> Update([FromRoute] Guid id, [FromBody] PartUpdateDto dto)
    {
        var part = await _partService.UpdateAsync(id, dto);
        if (part == null)
        {
            return NotFound();
        }
        return Ok(part);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete([FromRoute] Guid id)
    {
        var result = await _partService.DeleteAsync(id);
        if (!result)
        {
            return NotFound();
        }
        return NoContent();
    }
}
