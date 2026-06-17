using Microsoft.AspNetCore.Mvc;
using SiteSchedule.Dtos.Common;
using SiteSchedule.Dtos.TagGroupRule;
using SiteSchedule.Services;

namespace SiteSchedule.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TagGroupRulesController : ControllerBase
{
    private readonly ITagGroupRuleService _service;

    public TagGroupRulesController(ITagGroupRuleService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ApiResponse<PagedResult<TagGroupRuleDto>>> GetPagedList([FromQuery] TagGroupRuleQueryDto query)
    {
        var result = await _service.GetPagedListAsync(query);
        return ApiResponse<PagedResult<TagGroupRuleDto>>.Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ApiResponse<TagGroupRuleDto>> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        if (result == null)
            return ApiResponse<TagGroupRuleDto>.Fail("标签分组不存在", 404);

        return ApiResponse<TagGroupRuleDto>.Ok(result);
    }

    [HttpPost]
    public async Task<ApiResponse<TagGroupRuleDto>> Create([FromBody] TagGroupRuleCreateDto dto)
    {
        var result = await _service.CreateAsync(dto);
        return ApiResponse<TagGroupRuleDto>.Ok(result, "创建成功");
    }

    [HttpPut]
    public async Task<ApiResponse<TagGroupRuleDto>> Update([FromBody] TagGroupRuleUpdateDto dto)
    {
        try
        {
            var result = await _service.UpdateAsync(dto);
            return ApiResponse<TagGroupRuleDto>.Ok(result, "更新成功");
        }
        catch (KeyNotFoundException ex)
        {
            return ApiResponse<TagGroupRuleDto>.Fail(ex.Message, 404);
        }
    }

    [HttpDelete("{id}")]
    public async Task<ApiResponse> Delete(int id)
    {
        var result = await _service.DeleteAsync(id);
        if (!result)
            return ApiResponse.Fail("删除失败，标签分组不存在", 404);

        return ApiResponse.Ok("删除成功");
    }

    [HttpGet("all")]
    public async Task<ApiResponse<List<TagGroupRuleDto>>> GetAll()
    {
        var result = await _service.GetAllAsync();
        return ApiResponse<List<TagGroupRuleDto>>.Ok(result);
    }
}
