using DentalClinic.API.Enums;

namespace DentalClinic.API.DTOs;

public class TreatmentPlanDto
{
    public int Id { get; set; }
    public int PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string PlanName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public TreatmentStatus Status { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? ExpectedEndDate { get; set; }
    public DateTime? ActualEndDate { get; set; }
    public decimal EstimatedCost { get; set; }
    public decimal ActualCost { get; set; }
    public string? DoctorName { get; set; }
    public string? AssistantName { get; set; }
    public int? TotalVisits { get; set; }
    public int CompletedVisits { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<TreatmentPlanItemDto> PlanItems { get; set; } = new();
}

public class TreatmentPlanItemDto
{
    public int Id { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Sequence { get; set; }
    public decimal Price { get; set; }
    public int Quantity { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }
}

public class CreateTreatmentPlanDto
{
    public int PatientId { get; set; }
    public string PlanName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? ExpectedEndDate { get; set; }
    public decimal EstimatedCost { get; set; }
    public string? DoctorName { get; set; }
    public string? AssistantName { get; set; }
    public int? TotalVisits { get; set; }
    public string? Notes { get; set; }
    public List<CreateTreatmentPlanItemDto> PlanItems { get; set; } = new();
}

public class CreateTreatmentPlanItemDto
{
    public string ItemName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Sequence { get; set; }
    public decimal Price { get; set; }
    public int Quantity { get; set; }
}

public class UpdateTreatmentPlanDto
{
    public string PlanName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public TreatmentStatus? Status { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? ExpectedEndDate { get; set; }
    public DateTime? ActualEndDate { get; set; }
    public decimal? EstimatedCost { get; set; }
    public decimal? ActualCost { get; set; }
    public string? DoctorName { get; set; }
    public string? AssistantName { get; set; }
    public int? TotalVisits { get; set; }
    public int? CompletedVisits { get; set; }
    public string? Notes { get; set; }
}
