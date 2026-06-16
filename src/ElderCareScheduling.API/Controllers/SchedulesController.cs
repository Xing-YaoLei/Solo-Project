using ElderCareScheduling.API.Models.DTOs;
using ElderCareScheduling.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace ElderCareScheduling.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SchedulesController : ControllerBase
{
    private readonly IScheduleService _scheduleService;

    public SchedulesController(IScheduleService scheduleService)
    {
        _scheduleService = scheduleService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(PagedResultDto<ScheduleListDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResultDto<ScheduleListDto>>> GetList([FromQuery] ScheduleQueryDto query)
    {
        var result = await _scheduleService.GetListAsync(query);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ScheduleDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ScheduleDetailDto>> GetById(Guid id)
    {
        var result = await _scheduleService.GetByIdAsync(id);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(ScheduleDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ScheduleDetailDto>> Create([FromBody] CreateScheduleDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await _scheduleService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ScheduleDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ScheduleDetailDto>> Update(Guid id, [FromBody] UpdateScheduleDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await _scheduleService.UpdateAsync(id, dto);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var success = await _scheduleService.DeleteAsync(id);
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpPost("{id:guid}/submit")]
    [ProducesResponseType(typeof(ScheduleDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ScheduleDetailDto>> SubmitForReview(Guid id, [FromBody] ScheduleStatusChangeDto dto)
    {
        var result = await _scheduleService.SubmitForReviewAsync(id, dto.Operator);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost("{id:guid}/approve")]
    [ProducesResponseType(typeof(ScheduleDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ScheduleDetailDto>> ApproveReview(Guid id, [FromBody] ScheduleStatusChangeDto dto)
    {
        var result = await _scheduleService.ApproveReviewAsync(id, dto);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost("{id:guid}/reject")]
    [ProducesResponseType(typeof(ScheduleDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ScheduleDetailDto>> RejectReview(Guid id, [FromBody] ScheduleStatusChangeDto dto)
    {
        var result = await _scheduleService.RejectReviewAsync(id, dto);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost("{id:guid}/start")]
    [ProducesResponseType(typeof(ScheduleDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ScheduleDetailDto>> StartProcessing(Guid id, [FromBody] ScheduleStatusChangeDto dto)
    {
        var result = await _scheduleService.StartProcessingAsync(id, dto.Operator);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost("{id:guid}/complete")]
    [ProducesResponseType(typeof(ScheduleDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ScheduleDetailDto>> CompleteProcessing(Guid id, [FromBody] ScheduleStatusChangeDto dto)
    {
        var result = await _scheduleService.CompleteProcessingAsync(id, dto);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost("{id:guid}/postreview/submit")]
    [ProducesResponseType(typeof(ScheduleDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ScheduleDetailDto>> SubmitPostReview(Guid id, [FromBody] ScheduleStatusChangeDto dto)
    {
        var result = await _scheduleService.SubmitPostReviewAsync(id, dto.Operator);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost("{id:guid}/postreview/complete")]
    [ProducesResponseType(typeof(ScheduleDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ScheduleDetailDto>> CompletePostReview(Guid id, [FromBody] ScheduleStatusChangeDto dto)
    {
        var result = await _scheduleService.CompletePostReviewAsync(id, dto);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost("{id:guid}/close")]
    [ProducesResponseType(typeof(ScheduleDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ScheduleDetailDto>> CloseSchedule(Guid id, [FromBody] ScheduleStatusChangeDto dto)
    {
        var result = await _scheduleService.CloseScheduleAsync(id, dto.Operator);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost("{id:guid}/status")]
    [ProducesResponseType(typeof(ScheduleDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ScheduleDetailDto>> ChangeStatus(Guid id, [FromBody] ScheduleStatusChangeDto dto)
    {
        var result = await _scheduleService.ChangeStatusAsync(id, dto);
        if (result == null) return NotFound();
        return Ok(result);
    }
}
