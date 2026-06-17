using Microsoft.AspNetCore.Mvc;
using SiteSchedule.Dtos.Common;
using SiteSchedule.Dtos.MaterialSubmission;
using SiteSchedule.Services;

namespace SiteSchedule.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MaterialSubmissionsController : ControllerBase
{
    private readonly IMaterialSubmissionService _service;

    public MaterialSubmissionsController(IMaterialSubmissionService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ApiResponse<PagedResult<MaterialSubmissionDto>>> GetPagedList([FromQuery] MaterialSubmissionQueryDto query)
    {
        var result = await _service.GetPagedListAsync(query);
        return ApiResponse<PagedResult<MaterialSubmissionDto>>.Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ApiResponse<MaterialSubmissionDto>> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        if (result == null)
            return ApiResponse<MaterialSubmissionDto>.Fail("材料提交不存在", 404);

        return ApiResponse<MaterialSubmissionDto>.Ok(result);
    }

    [HttpGet("site/{siteId}")]
    public async Task<ApiResponse<List<MaterialSubmissionDto>>> GetBySiteId(int siteId)
    {
        var result = await _service.GetBySiteIdAsync(siteId);
        return ApiResponse<List<MaterialSubmissionDto>>.Ok(result);
    }

    [HttpPost]
    public async Task<ApiResponse<MaterialSubmissionDto>> Create([FromBody] MaterialSubmissionCreateDto dto)
    {
        var result = await _service.CreateAsync(dto);
        return ApiResponse<MaterialSubmissionDto>.Ok(result, "提交成功");
    }

    [HttpPut]
    public async Task<ApiResponse<MaterialSubmissionDto>> Update([FromBody] MaterialSubmissionUpdateDto dto)
    {
        try
        {
            var result = await _service.UpdateAsync(dto);
            return ApiResponse<MaterialSubmissionDto>.Ok(result, "更新成功");
        }
        catch (KeyNotFoundException ex)
        {
            return ApiResponse<MaterialSubmissionDto>.Fail(ex.Message, 404);
        }
    }

    [HttpDelete("{id}")]
    public async Task<ApiResponse> Delete(int id)
    {
        var result = await _service.DeleteAsync(id);
        if (!result)
            return ApiResponse.Fail("删除失败，材料提交不存在", 404);

        return ApiResponse.Ok("删除成功");
    }

    [HttpPost("review")]
    public async Task<ApiResponse<MaterialSubmissionDto>> Review([FromBody] MaterialSubmissionReviewDto dto)
    {
        try
        {
            var result = await _service.ReviewAsync(dto);
            return ApiResponse<MaterialSubmissionDto>.Ok(result, "审核完成");
        }
        catch (KeyNotFoundException ex)
        {
            return ApiResponse<MaterialSubmissionDto>.Fail(ex.Message, 404);
        }
    }

    [HttpPost("retry")]
    public async Task<ApiResponse<MaterialSubmissionDto>> Retry([FromBody] MaterialSubmissionRetryDto dto)
    {
        try
        {
            var result = await _service.RetryAsync(dto);
            return ApiResponse<MaterialSubmissionDto>.Ok(result, "重试提交成功");
        }
        catch (KeyNotFoundException ex)
        {
            return ApiResponse<MaterialSubmissionDto>.Fail(ex.Message, 404);
        }
    }

    [HttpPost("close")]
    public async Task<ApiResponse<MaterialSubmissionDto>> Close([FromBody] MaterialSubmissionCloseDto dto)
    {
        try
        {
            var result = await _service.CloseAsync(dto);
            return ApiResponse<MaterialSubmissionDto>.Ok(result, "关闭成功");
        }
        catch (KeyNotFoundException ex)
        {
            return ApiResponse<MaterialSubmissionDto>.Fail(ex.Message, 404);
        }
    }

    [HttpPost("supplement")]
    public async Task<ApiResponse<MaterialSubmissionDto>> Supplement([FromBody] MaterialSubmissionCreateDto dto)
    {
        var result = await _service.SupplementAsync(dto);
        return ApiResponse<MaterialSubmissionDto>.Ok(result, "补录成功");
    }
}
