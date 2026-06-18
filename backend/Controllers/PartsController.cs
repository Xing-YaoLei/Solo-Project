using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using CarServiceAppointment.API.DTOs;
using CarServiceAppointment.API.Services;

namespace CarServiceAppointment.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[SwaggerTag("配件库存管理")]
public class PartsController : ControllerBase
{
    private readonly IPartsService _partsService;

    public PartsController(IPartsService partsService)
    {
        _partsService = partsService;
    }

    [HttpGet]
    [SwaggerOperation(Summary = "分页获取配件列表")]
    public async Task<ActionResult<PagedResultDto<PartsDto>>> GetPaged([FromQuery] int pageIndex = 1, [FromQuery] int pageSize = 20, [FromQuery] string? keyword = null)
    {
        var result = await _partsService.GetPagedAsync(pageIndex, pageSize, keyword);
        return Ok(result);
    }

    [HttpGet("{id}")]
    [SwaggerOperation(Summary = "获取配件详情")]
    public async Task<ActionResult<PartsDto>> GetById(int id)
    {
        try
        {
            var result = await _partsService.GetByIdAsync(id);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpGet("low-stock")]
    [SwaggerOperation(Summary = "获取低于安全库存的配件列表")]
    public async Task<ActionResult<List<PartsDto>>> GetLowStock()
    {
        var result = await _partsService.GetLowStockAsync();
        return Ok(result);
    }

    [HttpPost]
    [SwaggerOperation(Summary = "创建配件")]
    public async Task<ActionResult<PartsDto>> Create([FromBody] CreatePartsDto dto)
    {
        try
        {
            var result = await _partsService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{id}")]
    [SwaggerOperation(Summary = "更新配件")]
    public async Task<ActionResult<PartsDto>> Update(int id, [FromBody] UpdatePartsDto dto)
    {
        try
        {
            var result = await _partsService.UpdateAsync(id, dto);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpDelete("{id}")]
    [SwaggerOperation(Summary = "删除配件")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await _partsService.DeleteAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{id}/add-stock")]
    [SwaggerOperation(Summary = "配件入库")]
    public async Task<ActionResult<PartsDto>> AddStock(int id, [FromBody] UpdateStockDto dto)
    {
        try
        {
            var result = await _partsService.AddStockAsync(id, dto);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{id}/reduce-stock")]
    [SwaggerOperation(Summary = "配件出库")]
    public async Task<ActionResult<PartsDto>> ReduceStock(int id, [FromBody] UpdateStockDto dto)
    {
        try
        {
            var result = await _partsService.ReduceStockAsync(id, dto);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("shortage-records")]
    [SwaggerOperation(Summary = "获取所有缺货记录")]
    public async Task<ActionResult<List<PartsShortageRecordDto>>> GetShortageRecords()
    {
        var result = await _partsService.GetAllShortageRecordsAsync();
        return Ok(result);
    }
}
