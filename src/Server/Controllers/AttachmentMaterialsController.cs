using Microsoft.AspNetCore.Mvc;
using SiteSchedule.Dtos.AttachmentMaterial;
using SiteSchedule.Dtos.Common;
using SiteSchedule.Models;
using SiteSchedule.Services;

namespace SiteSchedule.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AttachmentMaterialsController : ControllerBase
{
    private readonly IAttachmentMaterialService _service;

    public AttachmentMaterialsController(IAttachmentMaterialService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ApiResponse<PagedResult<AttachmentMaterialDto>>> GetPagedList([FromQuery] AttachmentMaterialQueryDto query)
    {
        var result = await _service.GetPagedListAsync(query);
        return ApiResponse<PagedResult<AttachmentMaterialDto>>.Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ApiResponse<AttachmentMaterialDto>> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        if (result == null)
            return ApiResponse<AttachmentMaterialDto>.Fail("附件材料不存在", 404);

        return ApiResponse<AttachmentMaterialDto>.Ok(result);
    }

    [HttpPost]
    public async Task<ApiResponse<AttachmentMaterialDto>> Create([FromBody] AttachmentMaterialCreateDto dto)
    {
        var result = await _service.CreateAsync(dto);
        return ApiResponse<AttachmentMaterialDto>.Ok(result, "创建成功");
    }

    [HttpPut]
    public async Task<ApiResponse<AttachmentMaterialDto>> Update([FromBody] AttachmentMaterialUpdateDto dto)
    {
        try
        {
            var result = await _service.UpdateAsync(dto);
            return ApiResponse<AttachmentMaterialDto>.Ok(result, "更新成功");
        }
        catch (KeyNotFoundException ex)
        {
            return ApiResponse<AttachmentMaterialDto>.Fail(ex.Message, 404);
        }
    }

    [HttpDelete("{id}")]
    public async Task<ApiResponse> Delete(int id)
    {
        var result = await _service.DeleteAsync(id);
        if (!result)
            return ApiResponse.Fail("删除失败，附件材料不存在", 404);

        return ApiResponse.Ok("删除成功");
    }

    [HttpGet("all")]
    public async Task<ApiResponse<List<AttachmentMaterialDto>>> GetAll()
    {
        var result = await _service.GetAllAsync();
        return ApiResponse<List<AttachmentMaterialDto>>.Ok(result);
    }

    [HttpGet("category/{category}")]
    public async Task<ApiResponse<List<AttachmentMaterialDto>>> GetByCategory(MaterialCategory category)
    {
        var result = await _service.GetByCategoryAsync(category);
        return ApiResponse<List<AttachmentMaterialDto>>.Ok(result);
    }
}
