using ElderCareScheduling.API.Models.DTOs;
using ElderCareScheduling.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace ElderCareScheduling.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CareLevelsController : ControllerBase
{
    private readonly ICareLevelService _careLevelService;

    public CareLevelsController(ICareLevelService careLevelService)
    {
        _careLevelService = careLevelService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<CareLevelDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<CareLevelDto>>> GetAll()
    {
        var result = await _careLevelService.GetAllAsync();
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(CareLevelDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CareLevelDto>> GetById(Guid id)
    {
        var result = await _careLevelService.GetByIdAsync(id);
        if (result == null) return NotFound();
        return Ok(result);
    }
}
