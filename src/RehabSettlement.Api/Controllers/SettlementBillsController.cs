using Microsoft.AspNetCore.Mvc;
using RehabSettlement.Api.Dtos;
using RehabSettlement.Api.Services;

namespace RehabSettlement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SettlementBillsController : ControllerBase
{
    private readonly ISettlementBillService _billService;

    public SettlementBillsController(ISettlementBillService billService)
    {
        _billService = billService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResultDto<SettlementBillDto>>> GetList([FromQuery] BillListQueryDto query)
    {
        var result = await _billService.GetBillListAsync(query);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SettlementBillDto>> GetById(int id)
    {
        var bill = await _billService.GetBillByIdAsync(id);
        if (bill == null) return NotFound();
        return Ok(bill);
    }

    [HttpGet("{id}/detail")]
    public async Task<ActionResult<SettlementBillDetailDto>> GetDetail(int id)
    {
        var detail = await _billService.GetBillDetailAsync(id);
        if (detail == null) return NotFound();
        return Ok(detail);
    }

    [HttpPost]
    public async Task<ActionResult<SettlementBillDto>> Create([FromBody] CreateSettlementBillDto dto)
    {
        var bill = await _billService.CreateBillAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = bill.Id }, bill);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<SettlementBillDto>> Update(int id, [FromBody] UpdateSettlementBillDto dto)
    {
        var bill = await _billService.UpdateBillAsync(id, dto);
        if (bill == null) return NotFound();
        return Ok(bill);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _billService.DeleteBillAsync(id);
        if (!result) return NotFound();
        return NoContent();
    }

    [HttpPost("{id}/submit")]
    public async Task<ActionResult<SettlementBillDto>> Submit(int id)
    {
        var bill = await _billService.SubmitBillAsync(id);
        if (bill == null) return NotFound();
        return Ok(bill);
    }

    [HttpPost("{id}/review")]
    public async Task<ActionResult<SettlementBillDto>> Review(int id, [FromBody] ReviewRequestDto dto)
    {
        var bill = await _billService.ReviewBillAsync(id, dto.Approved, dto.Remark);
        if (bill == null) return NotFound();
        return Ok(bill);
    }

    [HttpPost("{id}/process")]
    public async Task<ActionResult<SettlementBillDto>> Process(int id)
    {
        var bill = await _billService.ProcessBillAsync(id);
        if (bill == null) return NotFound();
        return Ok(bill);
    }

    [HttpPost("{id}/final-review")]
    public async Task<ActionResult<SettlementBillDto>> FinalReview(int id, [FromBody] ReviewRequestDto dto)
    {
        var bill = await _billService.FinalReviewBillAsync(id, dto.Approved, dto.Remark);
        if (bill == null) return NotFound();
        return Ok(bill);
    }

    [HttpPost("{id}/close")]
    public async Task<ActionResult<SettlementBillDto>> Close(int id, [FromBody] CloseRequestDto dto)
    {
        var bill = await _billService.CloseBillAsync(id, dto.Remark);
        if (bill == null) return NotFound();
        return Ok(bill);
    }

    [HttpPost("{id}/assign")]
    public async Task<ActionResult<SettlementBillDto>> Assign(int id, [FromBody] AssignRequestDto dto)
    {
        var bill = await _billService.AssignBillAsync(id, dto.AssigneeId);
        if (bill == null) return NotFound();
        return Ok(bill);
    }

    [HttpPost("{id}/tags")]
    public async Task<IActionResult> AddTags(int id, [FromBody] AddTagsRequestDto dto)
    {
        await _billService.AddReviewTagsAsync(id, dto.TagIds);
        return NoContent();
    }

    [HttpDelete("{id}/tags/{tagId}")]
    public async Task<IActionResult> RemoveTag(int id, int tagId)
    {
        await _billService.RemoveReviewTagAsync(id, tagId);
        return NoContent();
    }
}

public class ReviewRequestDto
{
    public bool Approved { get; set; }
    public string? Remark { get; set; }
}

public class CloseRequestDto
{
    public string? Remark { get; set; }
}

public class AssignRequestDto
{
    public int AssigneeId { get; set; }
}

public class AddTagsRequestDto
{
    public List<int> TagIds { get; set; } = new();
}
