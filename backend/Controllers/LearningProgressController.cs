using Microsoft.AspNetCore.Mvc;
using CertSchedulePlatform.DTOs;
using CertSchedulePlatform.Entities;
using CertSchedulePlatform.Services;

namespace CertSchedulePlatform.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LearningProgressController : ControllerBase
{
    private readonly ILearningProgressService _progressService;

    public LearningProgressController(ILearningProgressService progressService)
    {
        _progressService = progressService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<LearningProgressDto>>> GetList(
        [FromQuery] int? userId,
        [FromQuery] int? certificateId,
        [FromQuery] int? courseId,
        [FromQuery] ProgressStatus? status,
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _progressService.GetListAsync(userId, certificateId, courseId, status, pageIndex, pageSize);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<LearningProgressDto>> GetById(int id)
    {
        var progress = await _progressService.GetByIdAsync(id);
        if (progress == null)
            return NotFound();

        return Ok(progress);
    }

    [HttpGet("{id}/detail")]
    public async Task<ActionResult<LearningProgressDetailDto>> GetDetail(int id)
    {
        var detail = await _progressService.GetDetailAsync(id);
        return Ok(detail);
    }

    [HttpGet("{id}/history")]
    public async Task<ActionResult<List<ProgressHistoryDto>>> GetHistory(int id)
    {
        var history = await _progressService.GetHistoryAsync(id);
        return Ok(history);
    }

    [HttpGet("user/{userId}")]
    public async Task<ActionResult<List<LearningProgressDto>>> GetByUser(int userId, [FromQuery] int? certificateId = null)
    {
        var progresses = await _progressService.GetByUserAsync(userId, certificateId);
        return Ok(progresses);
    }

    [HttpPost]
    public async Task<ActionResult<LearningProgressDto>> Create([FromBody] LearningProgressCreateDto dto)
    {
        var progress = await _progressService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = progress.Id }, progress);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<LearningProgressDto>> UpdateProgress(int id, [FromBody] LearningProgressUpdateDto dto)
    {
        var progress = await _progressService.UpdateProgressAsync(id, dto);
        if (progress == null)
            return NotFound();

        return Ok(progress);
    }
}
