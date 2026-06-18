using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using CarServiceAppointment.API.DTOs;
using CarServiceAppointment.API.Services;
using CarServiceAppointment.API.Models;

namespace CarServiceAppointment.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[SwaggerTag("预约单管理")]
public class AppointmentsController : ControllerBase
{
    private readonly IAppointmentService _appointmentService;

    public AppointmentsController(IAppointmentService appointmentService)
    {
        _appointmentService = appointmentService;
    }

    [HttpGet("list")]
    [SwaggerOperation(Summary = "获取预约单列表")]
    public async Task<ActionResult<List<AppointmentListDto>>> GetList([FromQuery] AppointmentStatus? status, [FromQuery] string? keyword)
    {
        var result = await _appointmentService.GetListAsync(status, keyword);
        return Ok(result);
    }

    [HttpGet]
    [SwaggerOperation(Summary = "分页获取预约单列表")]
    public async Task<ActionResult<PagedResultDto<AppointmentListDto>>> GetPaged([FromQuery] AppointmentQueryDto query)
    {
        var result = await _appointmentService.GetPagedAsync(query);
        return Ok(result);
    }

    [HttpGet("{id}")]
    [SwaggerOperation(Summary = "获取预约单详情")]
    public async Task<ActionResult<AppointmentDetailDto>> GetById(int id)
    {
        try
        {
            var result = await _appointmentService.GetByIdAsync(id);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpGet("{id}/detail")]
    [SwaggerOperation(Summary = "获取预约单完整详情")]
    public async Task<ActionResult<AppointmentDetailDto>> GetDetail(int id)
    {
        try
        {
            var result = await _appointmentService.GetDetailAsync(id);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpPost]
    [SwaggerOperation(Summary = "创建预约单")]
    public async Task<ActionResult<AppointmentDto>> Create([FromBody] CreateAppointmentDto dto)
    {
        try
        {
            var result = await _appointmentService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpPut("{id}")]
    [SwaggerOperation(Summary = "更新预约单")]
    public async Task<ActionResult<AppointmentDto>> Update(int id, [FromBody] UpdateAppointmentDto dto)
    {
        try
        {
            var result = await _appointmentService.UpdateAsync(id, dto);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpDelete("{id}")]
    [SwaggerOperation(Summary = "删除预约单")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await _appointmentService.DeleteAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpPut("{id}/status")]
    [SwaggerOperation(Summary = "变更预约单状态")]
    public async Task<ActionResult<AppointmentDetailDto>> ChangeStatus(int id, [FromBody] ChangeStatusDto dto)
    {
        try
        {
            var result = await _appointmentService.ChangeStatusAsync(id, dto);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpPut("{id}/checkin")]
    [SwaggerOperation(Summary = "车辆进厂")]
    public async Task<ActionResult<AppointmentDetailDto>> CheckIn(int id)
    {
        try
        {
            var result = await _appointmentService.CheckInAsync(id);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{id}/complete")]
    [SwaggerOperation(Summary = "完成维修")]
    public async Task<ActionResult<AppointmentDetailDto>> Complete(int id)
    {
        try
        {
            var result = await _appointmentService.CompleteAsync(id);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{id}/close")]
    [SwaggerOperation(Summary = "关闭预约单")]
    public async Task<ActionResult<AppointmentDetailDto>> Close(int id)
    {
        try
        {
            var result = await _appointmentService.CloseAsync(id);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{id}/reopen")]
    [SwaggerOperation(Summary = "重开预约单")]
    public async Task<ActionResult<AppointmentDetailDto>> Reopen(int id)
    {
        try
        {
            var result = await _appointmentService.ReopenAsync(id);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("{id}/parts-shortage")]
    [SwaggerOperation(Summary = "添加配件缺货记录")]
    public async Task<ActionResult<PartsShortageRecordDto>> AddPartsShortage(int id, [FromBody] PartsShortageHandleDto dto)
    {
        try
        {
            var result = await _appointmentService.AddPartsShortageAsync(id, dto);
            return CreatedAtAction(nameof(GetPartsShortages), new { appointmentId = id }, result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpGet("{id}/parts-shortage")]
    [SwaggerOperation(Summary = "获取预约单的配件缺货记录")]
    public async Task<ActionResult<List<PartsShortageRecordDto>>> GetPartsShortages(int id)
    {
        var result = await _appointmentService.GetPartsShortagesAsync(id);
        return Ok(result);
    }

    [HttpPut("{id}/parts-shortage/{shortageId}/resolve")]
    [SwaggerOperation(Summary = "解决配件缺货")]
    public async Task<ActionResult<AppointmentDetailDto>> ResolvePartsShortage(int id, int shortageId)
    {
        try
        {
            var result = await _appointmentService.ResolvePartsShortageAsync(id, shortageId);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{id}/supplement-data")]
    [SwaggerOperation(Summary = "资料补录")]
    public async Task<ActionResult<AppointmentDetailDto>> SupplementData(int id, [FromBody] DataSupplementDto dto)
    {
        try
        {
            var result = await _appointmentService.SupplementDataAsync(id, dto);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("{id}/request-review")]
    [SwaggerOperation(Summary = "申请升级复核")]
    public async Task<ActionResult<AppointmentDetailDto>> RequestReview(int id, [FromBody] string? remarks)
    {
        try
        {
            var result = await _appointmentService.RequestReviewAsync(id, remarks);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("{id}/process-review")]
    [SwaggerOperation(Summary = "处理升级复核")]
    public async Task<ActionResult<AppointmentDetailDto>> ProcessReview(int id, [FromBody] ReviewDto dto)
    {
        try
        {
            var result = await _appointmentService.ProcessReviewAsync(id, dto);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
