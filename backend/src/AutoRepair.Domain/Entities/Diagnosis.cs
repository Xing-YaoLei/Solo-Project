namespace AutoRepair.Domain.Entities;

public class Diagnosis
{
    public Guid Id { get; set; }
    public Guid VehicleId { get; set; }
    public Guid? WorkOrderId { get; set; }
    public string DiagnosedByUserId { get; set; } = string.Empty;
    public string SymptomDescription { get; set; } = string.Empty;
    public string DiagnosticResult { get; set; } = string.Empty;
    public string? FaultCodes { get; set; }
    public string? Recommendations { get; set; }
    public DateTime DiagnosedAt { get; set; }
    public DateTime CreatedAt { get; set; }

    public Vehicle? Vehicle { get; set; }
    public WorkOrder? WorkOrder { get; set; }
    public AppUser? DiagnosedByUser { get; set; }
}
