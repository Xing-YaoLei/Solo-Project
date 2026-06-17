
using Microsoft.AspNetCore.Mvc;
using MoveOutInspection.Core.DTOs.Overdue;
using MoveOutInspection.Core.Entities;
using MoveOutInspection.Core.Enums;
using MoveOutInspection.Core.Interfaces;
using MoveOutInspection.Infrastructure.Services;

namespace MoveOutInspection.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OverdueController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITimelineService _timelineService;

    public OverdueController(IUnitOfWork unitOfWork, ITimelineService timelineService)
    {
        _unitOfWork = unitOfWork;
        _timelineService = timelineService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<RentOverdueRecordDto>>> GetOverdueRecords(
        [FromQuery] bool? isResolved = null)
    {
        var records = isResolved.HasValue
            ? await _unitOfWork.RentOverdueRecords.FindAsync(r => r.IsResolved == isResolved.Value)
            : await _unitOfWork.RentOverdueRecords.GetAllAsync();

        var dtos = new List<RentOverdueRecordDto>();
        foreach (var r in records)
        {
            dtos.Add(await MapToDto(r));
        }
        return Ok(dtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<RentOverdueRecordDto>> GetOverdueRecord(Guid id)
    {
        var record = await _unitOfWork.RentOverdueRecords.GetByIdAsync(id);
        if (record == null) return NotFound();
        return Ok(await MapToDto(record));
    }

    [HttpPost]
    public async Task<ActionResult<RentOverdueRecordDto>> CreateOverdue([FromBody] CreateRentOverdueDto dto)
    {
        var order = await _unitOfWork.MoveOutOrders.GetByIdAsync(dto.MoveOutOrderId);
        if (order == null) return NotFound();

        var record = new RentOverdueRecord
        {
            Id = Guid.NewGuid(),
            MoveOutOrderId = dto.MoveOutOrderId,
            OverdueDays = dto.OverdueDays,
            OverdueAmount = dto.OverdueAmount,
            LateFee = dto.LateFee,
            DueDate = dto.DueDate,
            RecordedDate = DateTime.Now,
            BillingPeriod = dto.BillingPeriod,
            InitialResponsibility = dto.InitialResponsibility,
            FinalResponsibility = dto.InitialResponsibility,
            IsResolved = false,
            CreatedAt = DateTime.Now,
            CreatedBy = "system"
        };

        await _unitOfWork.RentOverdueRecords.AddAsync(record);

        foreach (var ap in dto.AffectedParties)
        {
            await _unitOfWork.AffectedParties.AddAsync(new AffectedParty
            {
                Id = Guid.NewGuid(),
                RentOverdueRecordId = record.Id,
                PartyName = ap.PartyName,
                PartyType = ap.PartyType,
                AssignedRole = ap.AssignedRole,
                StaffId = ap.StaffId,
                ContactInfo = ap.ContactInfo,
                ImpactDescription = ap.ImpactDescription,
                ImpactAmount = ap.ImpactAmount,
                HasSupplemented = false,
                CreatedAt = DateTime.Now,
                CreatedBy = "system"
            });
        }

        if (order.Status != MoveOutStatus.OverdueRent)
        {
            order.Status = MoveOutStatus.OverdueRent;
            order.UpdatedAt = DateTime.Now;
            order.UpdatedBy = "system";
            _unitOfWork.MoveOutOrders.Update(order);
        }

        await _unitOfWork.SaveChangesAsync();

        await _timelineService.AddEventAsync(
            dto.MoveOutOrderId,
            TimelineEventType.OverdueRecorded,
            "租金逾期记录已创建",
            $"逾期天数：{dto.OverdueDays}天，逾期金额：¥{dto.OverdueAmount:F2}{(dto.LateFee.HasValue ? $"，滞纳金：¥{dto.LateFee.Value:F2}" : "")}，涉及受影响对象：{dto.AffectedParties.Count}人",
            null, null, null, null, null, "系统",
            record.Id.ToString(),
            nameof(RentOverdueRecord));

        return CreatedAtAction(nameof(GetOverdueRecord), new { id = record.Id }, await MapToDto(record));
    }

    [HttpPut("{overdueId}/affected/{affectedPartyId}/supplement")]
    public async Task<IActionResult> SupplementAffectedParty(
        Guid overdueId, Guid affectedPartyId, [FromBody] SupplementAffectedPartyDto dto)
    {
        var party = await _unitOfWork.AffectedParties.GetByIdAsync(affectedPartyId);
        if (party == null || party.RentOverdueRecordId != overdueId) return NotFound();

        party.SupplementaryNotes = dto.SupplementaryNotes;
        party.HasSupplemented = true;
        party.SupplementedAt = DateTime.Now;
        party.UpdatedAt = DateTime.Now;
        party.UpdatedBy = party.StaffId.HasValue ? party.StaffId.Value.ToString() : "system";

        _unitOfWork.AffectedParties.Update(party);

        var record = await _unitOfWork.RentOverdueRecords.GetByIdAsync(overdueId);
        if (record != null)
        {
            record.SupplementaryNotes = (record.SupplementaryNotes ?? "") +
                $"\n[{party.PartyName}补充说明]：{dto.SupplementaryNotes}";
            _unitOfWork.RentOverdueRecords.Update(record);

            await _timelineService.AddEventAsync(
                record.MoveOutOrderId,
                TimelineEventType.CustomAction,
                $"{party.PartyName}补充了说明",
                dto.SupplementaryNotes,
                null, null, dto.SupplementaryNotes, null,
                party.StaffId, party.PartyName,
                party.Id.ToString(),
                nameof(AffectedParty));
        }

        await _unitOfWork.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{overdueId}/adjust-responsibility")]
    public async Task<ActionResult<ResponsibilityAdjustmentDto>> AdjustResponsibility(
        Guid overdueId, [FromBody] AdjustResponsibilityDto dto)
    {
        var record = await _unitOfWork.RentOverdueRecords.GetByIdAsync(overdueId);
        if (record == null) return NotFound();

        var previousResponsibility = record.FinalResponsibility;
        var adjusterId = Guid.Parse("22222222-2222-2222-2222-222222222222");

        var adjustment = new ResponsibilityAdjustment
        {
            Id = Guid.NewGuid(),
            RentOverdueRecordId = overdueId,
            PreviousResponsibility = previousResponsibility,
            NewResponsibility = dto.NewResponsibility,
            AdjustmentReason = dto.AdjustmentReason,
            EvidenceUrls = dto.EvidenceUrls,
            AdjustedById = adjusterId,
            AdjusterRole = RoleType.PropertyManager,
            AdjustedAt = DateTime.Now,
            IsApproved = true,
            ApprovedById = adjusterId,
            ApprovedAt = DateTime.Now,
            CreatedAt = DateTime.Now,
            CreatedBy = "system"
        };

        await _unitOfWork.ResponsibilityAdjustments.AddAsync(adjustment);

        record.FinalResponsibility = dto.NewResponsibility;
        record.UpdatedAt = DateTime.Now;
        record.UpdatedBy = "system";
        _unitOfWork.RentOverdueRecords.Update(record);

        await _unitOfWork.SaveChangesAsync();

        await _timelineService.AddEventAsync(
            record.MoveOutOrderId,
            TimelineEventType.ResponsibilityAdjusted,
            "责任归属已调整",
            $"责任方由 {previousResponsibility} 变更为 {dto.NewResponsibility}，调整原因：{dto.AdjustmentReason}",
            previousResponsibility.ToString(),
            dto.NewResponsibility.ToString(),
            dto.AdjustmentReason,
            dto.EvidenceUrls?.Split(';', StringSplitOptions.RemoveEmptyEntries).ToList(),
            adjusterId, "李娜",
            adjustment.Id.ToString(),
            nameof(ResponsibilityAdjustment));

        var adjustedBy = await _unitOfWork.Staffs.GetByIdAsync(adjustment.AdjustedById);
        var approvedBy = adjustment.ApprovedById.HasValue
            ? await _unitOfWork.Staffs.GetByIdAsync(adjustment.ApprovedById.Value)
            : null;

        return Ok(new ResponsibilityAdjustmentDto
        {
            Id = adjustment.Id,
            PreviousResponsibility = adjustment.PreviousResponsibility,
            NewResponsibility = adjustment.NewResponsibility,
            AdjustmentReason = adjustment.AdjustmentReason,
            EvidenceUrls = adjustment.EvidenceUrls,
            AdjustedById = adjustment.AdjustedById,
            AdjustedByName = adjustedBy?.Name,
            AdjusterRole = adjustment.AdjusterRole,
            AdjustedAt = adjustment.AdjustedAt,
            IsApproved = adjustment.IsApproved,
            ApprovedById = adjustment.ApprovedById,
            ApprovedByName = approvedBy?.Name,
            ApprovedAt = adjustment.ApprovedAt
        });
    }

    private async Task<RentOverdueRecordDto> MapToDto(RentOverdueRecord record)
    {
        var order = await _unitOfWork.MoveOutOrders.GetByIdAsync(record.MoveOutOrderId);
        var tenant = order != null ? await _unitOfWork.Tenants.GetByIdAsync(order.TenantId) : null;
        var apartment = order != null ? await _unitOfWork.Apartments.GetByIdAsync(order.ApartmentId) : null;

        var affectedParties = await _unitOfWork.AffectedParties.FindAsync(p => p.RentOverdueRecordId == record.Id);
        var affectedPartyDtos = new List<AffectedPartyDto>();
        foreach (var ap in affectedParties)
        {
            var staff = ap.StaffId.HasValue ? await _unitOfWork.Staffs.GetByIdAsync(ap.StaffId.Value) : null;
            affectedPartyDtos.Add(new AffectedPartyDto
            {
                Id = ap.Id,
                PartyName = ap.PartyName,
                PartyType = ap.PartyType,
                AssignedRole = ap.AssignedRole,
                StaffId = ap.StaffId,
                StaffName = staff?.Name,
                ContactInfo = ap.ContactInfo,
                ImpactDescription = ap.ImpactDescription,
                ImpactAmount = ap.ImpactAmount,
                HasSupplemented = ap.HasSupplemented,
                SupplementaryNotes = ap.SupplementaryNotes,
                SupplementedAt = ap.SupplementedAt
            });
        }

        var adjustments = await _unitOfWork.ResponsibilityAdjustments.FindAsync(a => a.RentOverdueRecordId == record.Id);
        var adjustmentDtos = new List<ResponsibilityAdjustmentDto>();
        foreach (var adj in adjustments)
        {
            var adjustedBy = await _unitOfWork.Staffs.GetByIdAsync(adj.AdjustedById);
            var approvedBy = adj.ApprovedById.HasValue ? await _unitOfWork.Staffs.GetByIdAsync(adj.ApprovedById.Value) : null;
            adjustmentDtos.Add(new ResponsibilityAdjustmentDto
            {
                Id = adj.Id,
                PreviousResponsibility = adj.PreviousResponsibility,
                NewResponsibility = adj.NewResponsibility,
                AdjustmentReason = adj.AdjustmentReason,
                EvidenceUrls = adj.EvidenceUrls,
                AdjustedById = adj.AdjustedById,
                AdjustedByName = adjustedBy?.Name,
                AdjusterRole = adj.AdjusterRole,
                AdjustedAt = adj.AdjustedAt,
                IsApproved = adj.IsApproved,
                ApprovedById = adj.ApprovedById,
                ApprovedByName = approvedBy?.Name,
                ApprovedAt = adj.ApprovedAt
            });
        }

        return new RentOverdueRecordDto
        {
            Id = record.Id,
            MoveOutOrderId = record.MoveOutOrderId,
            OrderNumber = order?.OrderNumber,
            TenantName = tenant?.Name,
            ApartmentNumber = apartment?.ApartmentNumber,
            OverdueDays = record.OverdueDays,
            OverdueAmount = record.OverdueAmount,
            LateFee = record.LateFee,
            DueDate = record.DueDate,
            RecordedDate = record.RecordedDate,
            BillingPeriod = record.BillingPeriod,
            IsResolved = record.IsResolved,
            Resolution = record.Resolution,
            ResolvedAt = record.ResolvedAt,
            InitialResponsibility = record.InitialResponsibility,
            FinalResponsibility = record.FinalResponsibility,
            SupplementaryNotes = record.SupplementaryNotes,
            AffectedParties = affectedPartyDtos,
            ResponsibilityAdjustments = adjustmentDtos
        };
    }
}
