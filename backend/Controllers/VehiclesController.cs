using CarServiceAppointment.API.DTOs;
using CarServiceAppointment.API.Services;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace CarServiceAppointment.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class VehiclesController : ControllerBase
{
    private readonly IVehicleService _service;
    private readonly ILogger<VehiclesController> _logger;

    public VehiclesController(IVehicleService service, ILogger<VehiclesController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpGet]
    [SwaggerOperation(Summary = "查询车辆列表", Description = "按关键字查询车辆档案，支持车牌号、车架号、车主、品牌等模糊搜索")]
    [SwaggerResponse(StatusCodes.Status200OK, "查询成功", typeof(List<VehicleDto>))]
    public async Task<ActionResult<List<VehicleDto>>> GetList(
        [FromQuery] string? keyword,
        CancellationToken cancellationToken)
    {
        var list = await _service.GetListAsync(keyword, cancellationToken);
        return Ok(list);
    }

    [HttpGet("{id:int}")]
    [SwaggerOperation(Summary = "按ID获取车辆", Description = "根据车辆ID获取详细信息")]
    [SwaggerResponse(StatusCodes.Status200OK, "查询成功", typeof(VehicleDto))]
    [SwaggerResponse(StatusCodes.Status404NotFound, "车辆不存在")]
    public async Task<ActionResult<VehicleDto>> GetById(int id, CancellationToken cancellationToken)
    {
        var vehicle = await _service.GetByIdAsync(id, cancellationToken);
        if (vehicle == null) return NotFound($"车辆ID {id} 不存在");
        return Ok(vehicle);
    }

    [HttpGet("by-plate/{plateNumber}")]
    [SwaggerOperation(Summary = "按车牌号获取车辆", Description = "根据车牌号精确查询")]
    [SwaggerResponse(StatusCodes.Status200OK, "查询成功", typeof(VehicleDto))]
    [SwaggerResponse(StatusCodes.Status404NotFound, "车辆不存在")]
    public async Task<ActionResult<VehicleDto>> GetByPlateNumber(string plateNumber, CancellationToken cancellationToken)
    {
        var vehicle = await _service.GetByPlateNumberAsync(plateNumber, cancellationToken);
        if (vehicle == null) return NotFound($"车牌号 {plateNumber} 不存在");
        return Ok(vehicle);
    }

    [HttpPost]
    [SwaggerOperation(Summary = "创建车辆档案", Description = "新增一辆车的档案记录")]
    [SwaggerResponse(StatusCodes.Status201Created, "创建成功", typeof(VehicleDto))]
    [SwaggerResponse(StatusCodes.Status400BadRequest, "参数错误或车辆已存在")]
    public async Task<ActionResult<VehicleDto>> Create(
        [FromBody] CreateVehicleDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var vehicle = await _service.CreateAsync(dto, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = vehicle.Id }, vehicle);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "创建车辆失败：{Message}", ex.Message);
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    [SwaggerOperation(Summary = "更新车辆档案", Description = "修改车辆基本信息（不允许改车牌号和车架号）")]
    [SwaggerResponse(StatusCodes.Status200OK, "更新成功", typeof(VehicleDto))]
    [SwaggerResponse(StatusCodes.Status404NotFound, "车辆不存在")]
    public async Task<ActionResult<VehicleDto>> Update(
        int id,
        [FromBody] UpdateVehicleDto dto,
        CancellationToken cancellationToken)
    {
        var vehicle = await _service.UpdateAsync(id, dto, cancellationToken);
        if (vehicle == null) return NotFound($"车辆ID {id} 不存在");
        return Ok(vehicle);
    }

    [HttpDelete("{id:int}")]
    [SwaggerOperation(Summary = "删除车辆档案", Description = "按ID删除车辆（物理删除）")]
    [SwaggerResponse(StatusCodes.Status204NoContent, "删除成功")]
    [SwaggerResponse(StatusCodes.Status404NotFound, "车辆不存在")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var deleted = await _service.DeleteAsync(id, cancellationToken);
        if (!deleted) return NotFound($"车辆ID {id} 不存在");
        return NoContent();
    }
}
