using Microsoft.AspNetCore.Mvc;
using SiteSchedule.Dtos.Common;
using SiteSchedule.Services;

namespace SiteSchedule.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PersonInChargesController : ControllerBase
{
    private readonly IPersonInChargeService _service;

    public PersonInChargesController(IPersonInChargeService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ApiResponse<PagedResult<PersonInChargeDto>>> GetPagedList([FromQuery] PersonInChargeQueryDto query)
    {
        var result = await _service.GetPagedListAsync(query);
        return ApiResponse<PagedResult<PersonInChargeDto>>.Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ApiResponse<PersonInChargeDto>> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        if (result == null)
            return ApiResponse<PersonInChargeDto>.Fail("负责人不存在", 404);

        return ApiResponse<PersonInChargeDto>.Ok(result);
    }

    [HttpPost]
    public async Task<ApiResponse<PersonInChargeDto>> Create([FromBody] PersonInChargeCreateDto dto)
    {
        var result = await _service.CreateAsync(dto);
        return ApiResponse<PersonInChargeDto>.Ok(result, "创建成功");
    }

    [HttpPut]
    public async Task<ApiResponse<PersonInChargeDto>> Update([FromBody] PersonInChargeUpdateDto dto)
    {
        try
        {
            var result = await _service.UpdateAsync(dto);
            return ApiResponse<PersonInChargeDto>.Ok(result, "更新成功");
        }
        catch (KeyNotFoundException ex)
        {
            return ApiResponse<PersonInChargeDto>.Fail(ex.Message, 404);
        }
    }

    [HttpDelete("{id}")]
    public async Task<ApiResponse> Delete(int id)
    {
        var result = await _service.DeleteAsync(id);
        if (!result)
            return ApiResponse.Fail("删除失败，负责人不存在", 404);

        return ApiResponse.Ok("删除成功");
    }

    [HttpGet("all")]
    public async Task<ApiResponse<List<PersonInChargeDto>>> GetAll()
    {
        var result = await _service.GetAllAsync();
        return ApiResponse<List<PersonInChargeDto>>.Ok(result);
    }

    [HttpGet("area/{areaId}")]
    public async Task<ApiResponse<List<PersonInChargeDto>>> GetByAreaId(int areaId)
    {
        var result = await _service.GetByAreaIdAsync(areaId);
        return ApiResponse<List<PersonInChargeDto>>.Ok(result);
    }
}
