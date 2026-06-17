using Microsoft.AspNetCore.Mvc;
using SiteSchedule.Dtos.Common;
using SiteSchedule.Dtos.ConstructionSite;
using SiteSchedule.Services;

namespace SiteSchedule.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ConstructionSitesController : ControllerBase
{
    private readonly IConstructionSiteService _service;

    public ConstructionSitesController(IConstructionSiteService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ApiResponse<PagedResult<ConstructionSiteDto>>> GetPagedList([FromQuery] ConstructionSiteQueryDto query)
    {
        var result = await _service.GetPagedListAsync(query);
        return ApiResponse<PagedResult<ConstructionSiteDto>>.Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ApiResponse<ConstructionSiteDto>> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        if (result == null)
            return ApiResponse<ConstructionSiteDto>.Fail("工地不存在", 404);

        return ApiResponse<ConstructionSiteDto>.Ok(result);
    }

    [HttpPost]
    public async Task<ApiResponse<ConstructionSiteDto>> Create([FromBody] ConstructionSiteCreateDto dto)
    {
        var result = await _service.CreateAsync(dto);
        return ApiResponse<ConstructionSiteDto>.Ok(result, "创建成功");
    }

    [HttpPut]
    public async Task<ApiResponse<ConstructionSiteDto>> Update([FromBody] ConstructionSiteUpdateDto dto)
    {
        try
        {
            var result = await _service.UpdateAsync(dto);
            return ApiResponse<ConstructionSiteDto>.Ok(result, "更新成功");
        }
        catch (KeyNotFoundException ex)
        {
            return ApiResponse<ConstructionSiteDto>.Fail(ex.Message, 404);
        }
    }

    [HttpDelete("{id}")]
    public async Task<ApiResponse> Delete(int id)
    {
        var result = await _service.DeleteAsync(id);
        if (!result)
            return ApiResponse.Fail("删除失败，工地不存在", 404);

        return ApiResponse.Ok("删除成功");
    }

    [HttpPut("status")]
    public async Task<ApiResponse> UpdateStatus([FromBody] ConstructionSiteStatusUpdateDto dto)
    {
        var result = await _service.UpdateStatusAsync(dto);
        if (!result)
            return ApiResponse.Fail("更新失败，工地不存在", 404);

        return ApiResponse.Ok("状态更新成功");
    }

    [HttpGet("{id}/complete-rate")]
    public async Task<ApiResponse<double>> GetMaterialCompleteRate(int id)
    {
        var result = await _service.GetMaterialCompleteRateAsync(id);
        return ApiResponse<double>.Ok(result);
    }
}
