using HomeImprovementPlatform.API.DTOs;
using HomeImprovementPlatform.API.DTOs.Material;
using HomeImprovementPlatform.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HomeImprovementPlatform.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MaterialsController : ControllerBase
{
    private readonly IMaterialService _materialService;

    public MaterialsController(IMaterialService materialService)
    {
        _materialService = materialService;
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedResponse<MaterialDto>>> GetAll(
        [FromQuery] bool? isActive,
        [FromQuery] string? category,
        [FromQuery] string? search,
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 20)
    {
        var allMaterials = await _materialService.GetAllAsync(isActive, category);

        var query = allMaterials.AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(m => m.Name.ToLower().Contains(s) || m.MaterialCode.ToLower().Contains(s));
        }

        var totalCount = query.Count();
        var items = query.OrderBy(m => m.Name)
                         .Skip((pageIndex - 1) * pageSize)
                         .Take(pageSize)
                         .ToList();

        return Ok(new PaginatedResponse<MaterialDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageIndex = pageIndex,
            PageSize = pageSize
        });
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<MaterialDto>> GetById(Guid id)
    {
        try
        {
            var material = await _materialService.GetByIdAsync(id);
            return Ok(material);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost]
    [Authorize(Roles = "Designer,Supervisor")]
    public async Task<ActionResult<MaterialDto>> Create([FromBody] CreateMaterialDto dto)
    {
        var material = await _materialService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = material.Id }, material);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Designer,Supervisor")]
    public async Task<ActionResult<MaterialDto>> Update(Guid id, [FromBody] UpdateMaterialDto dto)
    {
        try
        {
            var material = await _materialService.UpdateAsync(id, dto);
            return Ok(material);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Supervisor")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            await _materialService.DeleteAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}
