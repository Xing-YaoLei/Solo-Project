using Microsoft.EntityFrameworkCore;
using AutoRepair.Application.DTOs;
using AutoRepair.Application.Interfaces;
using AutoRepair.Domain.Entities;

namespace AutoRepair.Application.Services;

public class WorkOrderService : IWorkOrderService
{
    private readonly IAppDbContext _context;

    public WorkOrderService(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<WorkOrderDto>> GetAllAsync(string? userId = null, DateTime? date = null)
    {
        var query = _context.WorkOrders
            .Include(w => w.Vehicle)
            .Include(w => w.AssignedToUser)
            .Include(w => w.Items)
            .Include(w => w.Diagnoses)
            .AsQueryable();

        if (!string.IsNullOrEmpty(userId))
        {
            query = query.Where(w => w.AssignedToUserId == userId);
        }

        if (date.HasValue)
        {
            var targetDate = date.Value.Date;
            query = query.Where(w => w.ScheduledDate.Date == targetDate);
        }

        return await query
            .OrderByDescending(w => w.CreatedAt)
            .Select(w => MapToDto(w))
            .ToListAsync();
    }

    public async Task<IEnumerable<WorkOrderDto>> GetDailyScheduleAsync(DateTime date, string? userId = null)
    {
        var targetDate = date.Date;
        var query = _context.WorkOrders
            .Include(w => w.Vehicle)
            .Include(w => w.AssignedToUser)
            .Include(w => w.Items)
            .Include(w => w.Diagnoses)
            .Where(w => w.ScheduledDate.Date == targetDate
                && w.Status != WorkOrderStatus.Cancelled);

        if (!string.IsNullOrEmpty(userId))
        {
            query = query.Where(w => w.AssignedToUserId == userId);
        }

        return await query
            .OrderBy(w => w.ScheduledDate)
            .ThenBy(w => w.Status)
            .Select(w => MapToDto(w))
            .ToListAsync();
    }

    public async Task<WorkOrderDto?> GetByIdAsync(Guid id)
    {
        var workOrder = await _context.WorkOrders
            .Include(w => w.Vehicle)
            .Include(w => w.AssignedToUser)
            .Include(w => w.Items)
                .ThenInclude(i => i.Part)
            .Include(w => w.Diagnoses)
                .ThenInclude(d => d.DiagnosedByUser)
            .FirstOrDefaultAsync(w => w.Id == id);

        return workOrder != null ? MapToDto(workOrder) : null;
    }

    public async Task<WorkOrderDto> CreateAsync(WorkOrderCreateDto dto, string createdByUserId)
    {
        var orderNumber = await GenerateOrderNumberAsync();

        var workOrder = new WorkOrder
        {
            Id = Guid.NewGuid(),
            OrderNumber = orderNumber,
            VehicleId = dto.VehicleId,
            AssignedToUserId = dto.AssignedToUserId,
            Status = dto.Status,
            Description = dto.Description,
            ScheduledDate = dto.ScheduledDate,
            IsRework = false,
            OriginalOrderId = null,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        if (dto.Items != null && dto.Items.Any())
        {
            foreach (var itemDto in dto.Items)
            {
                workOrder.Items.Add(new WorkOrderItem
                {
                    Id = Guid.NewGuid(),
                    ItemName = itemDto.ItemName,
                    Description = itemDto.Description,
                    Quantity = itemDto.Quantity,
                    UnitPrice = itemDto.UnitPrice,
                    LaborCost = itemDto.LaborCost,
                    IsCompleted = false,
                    PartId = itemDto.PartId
                });
            }
        }

        if (dto.Status == WorkOrderStatus.InProgress)
        {
            workOrder.StartedAt = DateTime.UtcNow;
        }

        _context.WorkOrders.Add(workOrder);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(workOrder.Id) ?? MapToDto(workOrder);
    }

    public async Task<WorkOrderDto?> UpdateAsync(Guid id, WorkOrderUpdateDto dto)
    {
        var workOrder = await _context.WorkOrders.FindAsync(id);
        if (workOrder == null) return null;

        if (dto.AssignedToUserId != null) workOrder.AssignedToUserId = dto.AssignedToUserId;
        if (dto.Status.HasValue)
        {
            UpdateStatusInternal(workOrder, dto.Status.Value);
        }
        if (dto.Description != null) workOrder.Description = dto.Description;
        if (dto.ScheduledDate.HasValue) workOrder.ScheduledDate = dto.ScheduledDate.Value;

        workOrder.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return await GetByIdAsync(workOrder.Id);
    }

    public async Task<WorkOrderDto?> UpdateStatusAsync(Guid id, WorkOrderStatus status)
    {
        var workOrder = await _context.WorkOrders.FindAsync(id);
        if (workOrder == null) return null;

        UpdateStatusInternal(workOrder, status);
        workOrder.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return await GetByIdAsync(workOrder.Id);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var workOrder = await _context.WorkOrders.FindAsync(id);
        if (workOrder == null) return false;

        _context.WorkOrders.Remove(workOrder);
        await _context.SaveChangesAsync();
        return true;
    }

    private static void UpdateStatusInternal(WorkOrder workOrder, WorkOrderStatus newStatus)
    {
        var previousStatus = workOrder.Status;
        workOrder.Status = newStatus;

        if (newStatus == WorkOrderStatus.InProgress && previousStatus != WorkOrderStatus.InProgress)
        {
            workOrder.StartedAt = DateTime.UtcNow;
        }

        if (newStatus == WorkOrderStatus.Completed && previousStatus != WorkOrderStatus.Completed)
        {
            workOrder.CompletedAt = DateTime.UtcNow;
        }

        if (newStatus == WorkOrderStatus.Rework)
        {
            workOrder.IsRework = true;
        }
    }

    private async Task<string> GenerateOrderNumberAsync()
    {
        var datePrefix = DateTime.Now.ToString("yyyyMMdd");
        var lastOrder = await _context.WorkOrders
            .Where(w => w.OrderNumber.StartsWith("WO" + datePrefix))
            .OrderByDescending(w => w.OrderNumber)
            .FirstOrDefaultAsync();

        int sequence = 1;
        if (lastOrder != null)
        {
            var lastSeqStr = lastOrder.OrderNumber.Substring(10);
            if (int.TryParse(lastSeqStr, out var lastSeq))
            {
                sequence = lastSeq + 1;
            }
        }

        return $"WO{datePrefix}{sequence:D4}";
    }

    private static WorkOrderDto MapToDto(WorkOrder w) => new()
    {
        Id = w.Id,
        OrderNumber = w.OrderNumber,
        VehicleId = w.VehicleId,
        VehicleLicensePlate = w.Vehicle?.LicensePlate,
        VehicleBrand = w.Vehicle?.Brand,
        VehicleModel = w.Vehicle?.Model,
        AssignedToUserId = w.AssignedToUserId,
        AssignedToUserName = w.AssignedToUser?.FullName,
        Status = w.Status,
        StatusText = w.Status.ToString(),
        Description = w.Description,
        ScheduledDate = w.ScheduledDate,
        StartedAt = w.StartedAt,
        CompletedAt = w.CompletedAt,
        IsRework = w.IsRework,
        OriginalOrderId = w.OriginalOrderId,
        CreatedAt = w.CreatedAt,
        Items = w.Items?.Select(i => new WorkOrderItemDto
        {
            Id = i.Id,
            ItemName = i.ItemName,
            Description = i.Description,
            Quantity = i.Quantity,
            UnitPrice = i.UnitPrice,
            LaborCost = i.LaborCost,
            IsCompleted = i.IsCompleted,
            PartId = i.PartId,
            PartName = i.Part?.Name
        }).ToList() ?? new List<WorkOrderItemDto>(),
        Diagnoses = w.Diagnoses?.Select(d => new DiagnosisDto
        {
            Id = d.Id,
            VehicleId = d.VehicleId,
            VehicleLicensePlate = d.Vehicle?.LicensePlate,
            WorkOrderId = d.WorkOrderId,
            WorkOrderNumber = d.WorkOrder?.OrderNumber,
            DiagnosedByUserId = d.DiagnosedByUserId,
            DiagnosedByUserName = d.DiagnosedByUser?.FullName,
            SymptomDescription = d.SymptomDescription,
            DiagnosticResult = d.DiagnosticResult,
            FaultCodes = d.FaultCodes,
            Recommendations = d.Recommendations,
            DiagnosedAt = d.DiagnosedAt
        }).ToList() ?? new List<DiagnosisDto>()
    };
}
