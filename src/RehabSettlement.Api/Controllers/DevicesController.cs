using Microsoft.AspNetCore.Mvc;
using RehabSettlement.Api.Dtos;
using RehabSettlement.Api.Services;

namespace RehabSettlement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DevicesController : ControllerBase
{
    private readonly IDeviceService _service;

    public DevicesController(IDeviceService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<List<DeviceDto>>> GetAll()
    {
        var result = await _service.GetAllDevicesAsync();
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<DeviceDto>> GetById(int id)
    {
        var result = await _service.GetDeviceByIdAsync(id);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpGet("usage/bill/{billId}")]
    public async Task<ActionResult<List<DeviceUsageRecordDto>>> GetUsageByBillId(int billId)
    {
        var result = await _service.GetUsageRecordsByBillIdAsync(billId);
        return Ok(result);
    }

    [HttpGet("usage/device/{deviceId}")]
    public async Task<ActionResult<List<DeviceUsageRecordDto>>> GetUsageByDeviceId(int deviceId)
    {
        var result = await _service.GetUsageRecordsByDeviceIdAsync(deviceId);
        return Ok(result);
    }

    [HttpPost("usage")]
    public async Task<ActionResult<DeviceUsageRecordDto>> AddUsageRecord([FromBody] DeviceUsageRecordDto dto)
    {
        var result = await _service.AddUsageRecordAsync(dto);
        return Ok(result);
    }
}
