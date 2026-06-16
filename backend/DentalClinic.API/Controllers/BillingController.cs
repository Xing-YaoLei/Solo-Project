using DentalClinic.API.DTOs;
using DentalClinic.API.Enums;
using DentalClinic.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace DentalClinic.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BillingController : ControllerBase
{
    private readonly IBillingService _billingService;

    public BillingController(IBillingService billingService)
    {
        _billingService = billingService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<BillingRecordDto>>> GetBillingRecords(
        [FromQuery] int? patientId = null,
        [FromQuery] BillingStatus? status = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var records = await _billingService.GetBillingRecordsAsync(
            patientId, status, startDate, endDate, page, pageSize);

        var total = await _billingService.GetBillingRecordCountAsync(
            patientId, status, startDate, endDate);

        Response.Headers.Add("X-Total-Count", total.ToString());
        return Ok(records);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<BillingRecordDto>> GetBillingRecord(int id)
    {
        var record = await _billingService.GetBillingRecordByIdAsync(id);
        if (record == null) return NotFound();
        return Ok(record);
    }

    [HttpPost]
    public async Task<ActionResult<BillingRecordDto>> CreateBillingRecord([FromBody] CreateBillingRecordDto dto)
    {
        var record = await _billingService.CreateBillingRecordAsync(dto);
        return CreatedAtAction(nameof(GetBillingRecord), new { id = record.Id }, record);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<BillingRecordDto>> UpdateBillingRecord(int id, [FromBody] UpdateBillingRecordDto dto)
    {
        var record = await _billingService.UpdateBillingRecordAsync(id, dto);
        if (record == null) return NotFound();
        return Ok(record);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteBillingRecord(int id)
    {
        var result = await _billingService.DeleteBillingRecordAsync(id);
        if (!result) return NotFound();
        return NoContent();
    }

    [HttpGet("revenue")]
    public async Task<ActionResult<decimal>> GetTotalRevenue(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        var revenue = await _billingService.GetTotalRevenueAsync(startDate, endDate);
        return Ok(revenue);
    }
}
