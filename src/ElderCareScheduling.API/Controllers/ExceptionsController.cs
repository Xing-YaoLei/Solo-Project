using ElderCareScheduling.API.Models.DTOs;
using ElderCareScheduling.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace ElderCareScheduling.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ExceptionsController : ControllerBase
{
    private readonly IExceptionRecordService _exceptionService;

    public ExceptionsController(IExceptionRecordService exceptionService)
    {
        _exceptionService = exceptionService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(PagedResultDto<ExceptionRecordListDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResultDto<ExceptionRecordListDto>>> GetList([FromQuery] ExceptionQueryDto query)
    {
        var result = await _exceptionService.GetListAsync(query);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ExceptionRecordDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ExceptionRecordDetailDto>> GetById(Guid id)
    {
        var result = await _exceptionService.GetByIdAsync(id);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(ExceptionRecordDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ExceptionRecordDetailDto>> Create([FromBody] CreateExceptionRecordDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await _exceptionService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ExceptionRecordDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ExceptionRecordDetailDto>> Update(Guid id, [FromBody] UpdateExceptionRecordDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await _exceptionService.UpdateAsync(id, dto);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost("{id:guid}/assign")]
    [ProducesResponseType(typeof(ExceptionRecordDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ExceptionRecordDetailDto>> AssignHandler(Guid id, [FromBody] ExceptionStatusChangeDto dto)
    {
        var result = await _exceptionService.AssignHandlerAsync(id, dto);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost("{id:guid}/investigate")]
    [ProducesResponseType(typeof(ExceptionRecordDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ExceptionRecordDetailDto>> StartInvestigation(Guid id, [FromBody] ExceptionStatusChangeDto dto)
    {
        var result = await _exceptionService.StartInvestigationAsync(id, dto);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost("{id:guid}/handle")]
    [ProducesResponseType(typeof(ExceptionRecordDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ExceptionRecordDetailDto>> StartHandling(Guid id, [FromBody] ExceptionStatusChangeDto dto)
    {
        var result = await _exceptionService.StartHandlingAsync(id, dto);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost("{id:guid}/resolve")]
    [ProducesResponseType(typeof(ExceptionRecordDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ExceptionRecordDetailDto>> Resolve(Guid id, [FromBody] ExceptionStatusChangeDto dto)
    {
        var result = await _exceptionService.ResolveAsync(id, dto);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost("{id:guid}/supplement/request")]
    [ProducesResponseType(typeof(ExceptionRecordDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ExceptionRecordDetailDto>> RequestSupplement(Guid id, [FromBody] ExceptionStatusChangeDto dto)
    {
        var result = await _exceptionService.RequestSupplementAsync(id, dto);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost("{id:guid}/supplement/submit")]
    [ProducesResponseType(typeof(ExceptionRecordDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ExceptionRecordDetailDto>> SubmitSupplement(Guid id, [FromBody] ExceptionStatusChangeDto dto)
    {
        var result = await _exceptionService.SubmitSupplementAsync(id, dto);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost("{id:guid}/escalate")]
    [ProducesResponseType(typeof(ExceptionRecordDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ExceptionRecordDetailDto>> Escalate(Guid id, [FromBody] ExceptionStatusChangeDto dto)
    {
        var result = await _exceptionService.EscalateAsync(id, dto);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost("{id:guid}/close/normal")]
    [ProducesResponseType(typeof(ExceptionRecordDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ExceptionRecordDetailDto>> CloseNormal(Guid id, [FromBody] ExceptionStatusChangeDto dto)
    {
        var result = await _exceptionService.CloseNormalAsync(id, dto);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost("{id:guid}/close/supplement")]
    [ProducesResponseType(typeof(ExceptionRecordDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ExceptionRecordDetailDto>> CloseWithSupplement(Guid id, [FromBody] ExceptionStatusChangeDto dto)
    {
        var result = await _exceptionService.CloseWithSupplementAsync(id, dto);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost("{id:guid}/close/escalated")]
    [ProducesResponseType(typeof(ExceptionRecordDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ExceptionRecordDetailDto>> CloseEscalated(Guid id, [FromBody] ExceptionStatusChangeDto dto)
    {
        var result = await _exceptionService.CloseEscalatedAsync(id, dto);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost("{id:guid}/attachments")]
    [ProducesResponseType(typeof(ExceptionAttachmentDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ExceptionAttachmentDto>> AddAttachment(Guid id, [FromBody] ExceptionAttachmentDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await _exceptionService.AddAttachmentAsync(id, dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }
}
