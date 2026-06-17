using Microsoft.AspNetCore.Mvc;
using SiteSchedule.Dtos.Common;
using SiteSchedule.Services;

namespace SiteSchedule.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AreasController : ControllerBase
{
    private readonly IAreaService _service;

    public AreasController(IAreaService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ApiResponse<PagedResult<AreaDto>>> GetPagedList([FromQuery] AreaQueryDto query)
    {
        var result = await _service.GetPagedListAsync(query);
        return ApiResponse<PagedResult<AreaDto>>.Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ApiResponse<AreaDto>> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        if (result == null)
            return ApiResponse<AreaDto>.Fail("区域不存在", 404);

        return ApiResponse<AreaDto>.Ok(result);
    }

    [HttpPost]
    public async Task<ApiResponse<AreaDto>> Create([FromBody] AreaCreateDto dto)
    {
        var result = await _service.CreateAsync(dto);
        return ApiResponse<AreaDto>.Ok(result, "创建成功");
    }

    [HttpPut]
    public async Task<ApiResponse<AreaDto>> Update([FromBody] AreaUpdateDto dto)
    {
        try
        {
            var result = await _service.UpdateAsync(dto);
            return ApiResponse<AreaDto>.Ok(result, "更新成功");
        }
        catch (KeyNotFoundException ex)
        {
            return ApiResponse<AreaDto>.Fail(ex.Message, 404);
        }
    }

    [HttpDelete("{id}")]
    public async Task<ApiResponse> Delete(int id)
    {
        var result = await _service.DeleteAsync(id);
        if (!result)
            return ApiResponse.Fail("删除失败，区域不存在", 404);

        return ApiResponse.Ok("删除成功");
    }

    [HttpGet("all")]
    public async Task<ApiResponse<List<AreaDto>>> GetAll()
    {
        var result = await _service.GetAllAsync();
        return ApiResponse<List<AreaDto>>.Ok(result);
    }
}
