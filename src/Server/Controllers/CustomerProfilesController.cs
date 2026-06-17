using Microsoft.AspNetCore.Mvc;
using SiteSchedule.Dtos.Common;
using SiteSchedule.Dtos.CustomerProfile;
using SiteSchedule.Services;

namespace SiteSchedule.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CustomerProfilesController : ControllerBase
{
    private readonly ICustomerProfileService _service;

    public CustomerProfilesController(ICustomerProfileService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ApiResponse<PagedResult<CustomerProfileDto>>> GetPagedList([FromQuery] CustomerProfileQueryDto query)
    {
        var result = await _service.GetPagedListAsync(query);
        return ApiResponse<PagedResult<CustomerProfileDto>>.Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ApiResponse<CustomerProfileDto>> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        if (result == null)
            return ApiResponse<CustomerProfileDto>.Fail("客户不存在", 404);

        return ApiResponse<CustomerProfileDto>.Ok(result);
    }

    [HttpPost]
    public async Task<ApiResponse<CustomerProfileDto>> Create([FromBody] CustomerProfileCreateDto dto)
    {
        var result = await _service.CreateAsync(dto);
        return ApiResponse<CustomerProfileDto>.Ok(result, "创建成功");
    }

    [HttpPut]
    public async Task<ApiResponse<CustomerProfileDto>> Update([FromBody] CustomerProfileUpdateDto dto)
    {
        try
        {
            var result = await _service.UpdateAsync(dto);
            return ApiResponse<CustomerProfileDto>.Ok(result, "更新成功");
        }
        catch (KeyNotFoundException ex)
        {
            return ApiResponse<CustomerProfileDto>.Fail(ex.Message, 404);
        }
    }

    [HttpDelete("{id}")]
    public async Task<ApiResponse> Delete(int id)
    {
        var result = await _service.DeleteAsync(id);
        if (!result)
            return ApiResponse.Fail("删除失败，客户不存在", 404);

        return ApiResponse.Ok("删除成功");
    }

    [HttpGet("all")]
    public async Task<ApiResponse<List<CustomerProfileDto>>> GetAll()
    {
        var result = await _service.GetAllAsync();
        return ApiResponse<List<CustomerProfileDto>>.Ok(result);
    }
}
