using Microsoft.AspNetCore.Mvc;
using SiteSchedule.Dtos.AuthScopeThreshold;
using SiteSchedule.Dtos.Common;
using SiteSchedule.Services;

namespace SiteSchedule.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthScopeThresholdsController : ControllerBase
{
    private readonly IAuthScopeThresholdService _service;

    public AuthScopeThresholdsController(IAuthScopeThresholdService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ApiResponse<PagedResult<AuthScopeThresholdDto>>> GetPagedList([FromQuery] AuthScopeThresholdQueryDto query)
    {
        var result = await _service.GetPagedListAsync(query);
        return ApiResponse<PagedResult<AuthScopeThresholdDto>>.Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ApiResponse<AuthScopeThresholdDto>> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        if (result == null)
            return ApiResponse<AuthScopeThresholdDto>.Fail("授权阈值不存在", 404);

        return ApiResponse<AuthScopeThresholdDto>.Ok(result);
    }

    [HttpPost]
    public async Task<ApiResponse<AuthScopeThresholdDto>> Create([FromBody] AuthScopeThresholdCreateDto dto)
    {
        var result = await _service.CreateAsync(dto);
        return ApiResponse<AuthScopeThresholdDto>.Ok(result, "创建成功");
    }

    [HttpPut]
    public async Task<ApiResponse<AuthScopeThresholdDto>> Update([FromBody] AuthScopeThresholdUpdateDto dto)
    {
        try
        {
            var result = await _service.UpdateAsync(dto);
            return ApiResponse<AuthScopeThresholdDto>.Ok(result, "更新成功");
        }
        catch (KeyNotFoundException ex)
        {
            return ApiResponse<AuthScopeThresholdDto>.Fail(ex.Message, 404);
        }
    }

    [HttpDelete("{id}")]
    public async Task<ApiResponse> Delete(int id)
    {
        var result = await _service.DeleteAsync(id);
        if (!result)
            return ApiResponse.Fail("删除失败，授权阈值不存在", 404);

        return ApiResponse.Ok("删除成功");
    }

    [HttpGet("all")]
    public async Task<ApiResponse<List<AuthScopeThresholdDto>>> GetAll()
    {
        var result = await _service.GetAllAsync();
        return ApiResponse<List<AuthScopeThresholdDto>>.Ok(result);
    }
}
