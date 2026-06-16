using ElderCareScheduling.API.Models.DTOs;
using ElderCareScheduling.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace ElderCareScheduling.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BedsController : ControllerBase
{
    private readonly IBedService _bedService;

    public BedsController(IBedService bedService)
    {
        _bedService = bedService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<BedDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<BedDto>>> GetAll()
    {
        var result = await _bedService.GetAllAsync();
        return Ok(result);
    }

    [HttpGet("available")]
    [ProducesResponseType(typeof(List<BedDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<BedDto>>> GetAvailable()
    {
        var result = await _bedService.GetAvailableAsync();
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(BedDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BedDto>> GetById(Guid id)
    {
        var result = await _bedService.GetByIdAsync(id);
        if (result == null) return NotFound();
        return Ok(result);
    }
}
