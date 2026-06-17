
using Microsoft.AspNetCore.Mvc;
using MoveOutInspection.Core.DTOs.Utility;
using MoveOutInspection.Core.Entities;
using MoveOutInspection.Core.Enums;
using MoveOutInspection.Core.Interfaces;
using MoveOutInspection.Infrastructure.Services;

namespace MoveOutInspection.Api.Controllers;

[ApiController]
[Route("api/moveoutorders/{orderId}/[controller]")]
public class UtilityReadingsController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITimelineService _timelineService;

    public UtilityReadingsController(IUnitOfWork unitOfWork, ITimelineService timelineService)
    {
        _unitOfWork = unitOfWork;
        _timelineService = timelineService;
    }

    [HttpGet]
    public async Task<ActionResult<UtilitySummaryDto>> GetReadings(Guid orderId)
    {
        var readings = await _unitOfWork.UtilityReadings.FindAsync(r => r.MoveOutOrderId == orderId);
        var dtos = new List<UtilityReadingDto>();
        decimal total = 0;

        foreach (var r in readings)
        {
            var recordedBy = await _unitOfWork.Staffs.GetByIdAsync(r.RecordedById);
            dtos.Add(new UtilityReadingDto
            {
                Id = r.Id,
                UtilityType = r.UtilityType,
                PreviousReading = r.PreviousReading,
                PreviousReadingDate = r.PreviousReadingDate,
                CurrentReading = r.CurrentReading,
                CurrentReadingDate = r.CurrentReadingDate,
                Usage = r.Usage,
                UnitPrice = r.UnitPrice,
                Amount = r.Amount,
                MeterNumber = r.MeterNumber,
                PhotoUrl = r.PhotoUrl,
                Remarks = r.Remarks,
                RecordedByName = recordedBy?.Name
            });
            if (r.Amount.HasValue) total += r.Amount.Value;
        }

        return Ok(new UtilitySummaryDto
        {
            MoveOutOrderId = orderId,
            Readings = dtos,
            TotalAmount = total
        });
    }

    [HttpPost]
    public async Task<ActionResult<UtilityReadingDto>> CreateReading(Guid orderId, [FromBody] CreateUtilityReadingDto dto)
    {
        var order = await _unitOfWork.MoveOutOrders.GetByIdAsync(orderId);
        if (order == null) return NotFound();

        var usage = dto.CurrentReading - dto.PreviousReading;
        var amount = dto.UnitPrice.HasValue ? usage * dto.UnitPrice.Value : (decimal?)null;

        var reading = new UtilityReading
        {
            Id = Guid.NewGuid(),
            MoveOutOrderId = orderId,
            UtilityType = dto.UtilityType,
            PreviousReading = dto.PreviousReading,
            PreviousReadingDate = dto.PreviousReadingDate,
            CurrentReading = dto.CurrentReading,
            CurrentReadingDate = dto.CurrentReadingDate,
            Usage = usage,
            UnitPrice = dto.UnitPrice,
            Amount = amount,
            MeterNumber = dto.MeterNumber,
            PhotoUrl = dto.PhotoUrl,
            Remarks = dto.Remarks,
            RecordedById = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            CreatedAt = DateTime.Now,
            CreatedBy = "system"
        };

        await _unitOfWork.UtilityReadings.AddAsync(reading);
        await _unitOfWork.SaveChangesAsync();

        await _timelineService.AddEventAsync(
            orderId,
            TimelineEventType.UtilityRecorded,
            $"{dto.UtilityType}抄表已录入",
            $"上次读数：{dto.PreviousReading}，本次读数：{dto.CurrentReading}，用量：{usage}{(amount.HasValue ? $"，金额：¥{amount.Value:F2}" : "")}",
            null, null, null, dto.PhotoUrl != null ? new List<string> { dto.PhotoUrl } : null,
            reading.RecordedById, "张伟",
            reading.Id.ToString(),
            nameof(UtilityReading));

        var recordedBy = await _unitOfWork.Staffs.GetByIdAsync(reading.RecordedById);
        return CreatedAtAction(nameof(GetReadings), new { orderId }, new UtilityReadingDto
        {
            Id = reading.Id,
            UtilityType = reading.UtilityType,
            PreviousReading = reading.PreviousReading,
            PreviousReadingDate = reading.PreviousReadingDate,
            CurrentReading = reading.CurrentReading,
            CurrentReadingDate = reading.CurrentReadingDate,
            Usage = reading.Usage,
            UnitPrice = reading.UnitPrice,
            Amount = reading.Amount,
            MeterNumber = reading.MeterNumber,
            PhotoUrl = reading.PhotoUrl,
            Remarks = reading.Remarks,
            RecordedByName = recordedBy?.Name
        });
    }
}
