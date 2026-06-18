using AutoRepair.Domain.Entities;

namespace AutoRepair.Application.DTOs;

public class WorkOrderDto
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public Guid VehicleId { get; set; }
    public string? VehicleLicensePlate { get; set; }
    public string? VehicleBrand { get; set; }
    public string? VehicleModel { get; set; }
    public string? AssignedToUserId { get; set; }
    public string? AssignedToUserName { get; set; }
    public WorkOrderStatus Status { get; set; }
    public string StatusText { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime ScheduledDate { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public bool IsRework { get; set; }
    public Guid? OriginalOrderId { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<WorkOrderItemDto> Items { get; set; } = new();
    public List<DiagnosisDto> Diagnoses { get; set; } = new();
}

public class WorkOrderCreateDto
{
    public Guid VehicleId { get; set; }
    public string? AssignedToUserId { get; set; }
    public WorkOrderStatus Status { get; set; } = WorkOrderStatus.Pending;
    public string? Description { get; set; }
    public DateTime ScheduledDate { get; set; }
    public List<WorkOrderItemCreateDto> Items { get; set; } = new();
}

public class WorkOrderUpdateDto
{
    public string? AssignedToUserId { get; set; }
    public WorkOrderStatus? Status { get; set; }
    public string? Description { get; set; }
    public DateTime? ScheduledDate { get; set; }
}

public class WorkOrderItemDto
{
    public Guid Id { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal LaborCost { get; set; }
    public bool IsCompleted { get; set; }
    public Guid? PartId { get; set; }
    public string? PartName { get; set; }
}

public class WorkOrderItemCreateDto
{
    public string ItemName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal LaborCost { get; set; }
    public Guid? PartId { get; set; }
}
