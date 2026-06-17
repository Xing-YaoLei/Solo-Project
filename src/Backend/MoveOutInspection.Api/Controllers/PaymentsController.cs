
using Microsoft.AspNetCore.Mvc;
using MoveOutInspection.Core.DTOs.Payment;
using MoveOutInspection.Core.Entities;
using MoveOutInspection.Core.Enums;
using MoveOutInspection.Core.Interfaces;
using MoveOutInspection.Infrastructure.Services;

namespace MoveOutInspection.Api.Controllers;

[ApiController]
[Route("api/moveoutorders/{orderId}/[controller]")]
public class PaymentsController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITimelineService _timelineService;

    public PaymentsController(IUnitOfWork unitOfWork, ITimelineService timelineService)
    {
        _unitOfWork = unitOfWork;
        _timelineService = timelineService;
    }

    [HttpGet]
    public async Task<ActionResult<PaymentSummaryDto>> GetPayments(Guid orderId)
    {
        var records = await _unitOfWork.PaymentRecords.FindAsync(p => p.MoveOutOrderId == orderId);
        var dtos = new List<PaymentRecordDto>();
        decimal received = 0, refunded = 0, compensation = 0;

        foreach (var p in records)
        {
            var recordedBy = await _unitOfWork.Staffs.GetByIdAsync(p.RecordedById);
            dtos.Add(new PaymentRecordDto
            {
                Id = p.Id,
                TransactionNo = p.TransactionNo,
                PaymentType = p.PaymentType,
                PaymentMethod = p.PaymentMethod,
                Amount = p.Amount,
                PaymentDate = p.PaymentDate,
                PayerName = p.PayerName,
                PayeeName = p.PayeeName,
                ReferenceNo = p.ReferenceNo,
                VoucherUrl = p.VoucherUrl,
                Remarks = p.Remarks,
                RecordedByName = recordedBy?.Name,
                IsReconciled = p.IsReconciled,
                ReconciledAt = p.ReconciledAt
            });

            switch (p.PaymentType)
            {
                case PaymentType.Rent:
                case PaymentType.Utility:
                case PaymentType.LateFee:
                case PaymentType.DamageCompensation:
                case PaymentType.Other:
                    received += p.Amount;
                    break;
                case PaymentType.DepositRefund:
                    refunded += p.Amount;
                    break;
            }
            if (p.PaymentType == PaymentType.DamageCompensation)
                compensation += p.Amount;
        }

        return Ok(new PaymentSummaryDto
        {
            MoveOutOrderId = orderId,
            Records = dtos,
            TotalReceived = received,
            TotalRefunded = refunded,
            TotalCompensation = compensation,
            NetAmount = received - refunded
        });
    }

    [HttpPost]
    public async Task<ActionResult<PaymentRecordDto>> CreatePayment(Guid orderId, [FromBody] CreatePaymentRecordDto dto)
    {
        var order = await _unitOfWork.MoveOutOrders.GetByIdAsync(orderId);
        if (order == null) return NotFound();

        var record = new PaymentRecord
        {
            Id = Guid.NewGuid(),
            MoveOutOrderId = orderId,
            TransactionNo = $"PAY{DateTime.Now:yyyyMMddHHmmss}{new Random().Next(1000, 9999)}",
            PaymentType = dto.PaymentType,
            PaymentMethod = dto.PaymentMethod,
            Amount = dto.Amount,
            PaymentDate = dto.PaymentDate,
            PayerName = dto.PayerName,
            PayeeName = dto.PayeeName,
            ReferenceNo = dto.ReferenceNo,
            VoucherUrl = dto.VoucherUrl,
            Remarks = dto.Remarks,
            RecordedById = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            IsReconciled = false,
            CreatedAt = DateTime.Now,
            CreatedBy = "system"
        };

        await _unitOfWork.PaymentRecords.AddAsync(record);
        await _unitOfWork.SaveChangesAsync();

        await _timelineService.AddEventAsync(
            orderId,
            TimelineEventType.PaymentRecorded,
            $"{dto.PaymentType}收款已录入",
            $"金额：¥{dto.Amount:F2}，方式：{dto.PaymentMethod}，日期：{dto.PaymentDate:yyyy-MM-dd}",
            null, null, dto.Remarks, dto.VoucherUrl != null ? new List<string> { dto.VoucherUrl } : null,
            record.RecordedById, "王强",
            record.Id.ToString(),
            nameof(PaymentRecord));

        var recordedBy = await _unitOfWork.Staffs.GetByIdAsync(record.RecordedById);
        return CreatedAtAction(nameof(GetPayments), new { orderId }, new PaymentRecordDto
        {
            Id = record.Id,
            TransactionNo = record.TransactionNo,
            PaymentType = record.PaymentType,
            PaymentMethod = record.PaymentMethod,
            Amount = record.Amount,
            PaymentDate = record.PaymentDate,
            PayerName = record.PayerName,
            PayeeName = record.PayeeName,
            ReferenceNo = record.ReferenceNo,
            VoucherUrl = record.VoucherUrl,
            Remarks = record.Remarks,
            RecordedByName = recordedBy?.Name,
            IsReconciled = record.IsReconciled,
            ReconciledAt = record.ReconciledAt
        });
    }
}
