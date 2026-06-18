namespace AutoRepair.Domain.Entities;

public class WorkOrderItem
{
    public Guid Id { get; set; }
    public Guid WorkOrderId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal LaborCost { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }
    public Guid? PartId { get; set; }

    public WorkOrder? WorkOrder { get; set; }
    public Part? Part { get; set; }
}
