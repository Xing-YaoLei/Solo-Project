using ElderCareScheduling.API.Enums;

namespace ElderCareScheduling.API.Models.DTOs;

public class CareLevelDto
{
    public Guid Id { get; set; }
    public CareLevelType LevelType { get; set; }
    public string LevelTypeText { get; set; } = string.Empty;
    public string LevelName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? CareItems { get; set; }
    public string? ServiceStandards { get; set; }
    public int DailyCareHours { get; set; }
    public int NurseRatio { get; set; }
    public decimal? MonthlyFee { get; set; }
}

public class BedDto
{
    public Guid Id { get; set; }
    public string BedNumber { get; set; } = string.Empty;
    public string? RoomNumber { get; set; }
    public string? Floor { get; set; }
    public string? Building { get; set; }
    public string? Description { get; set; }
    public BedStatus Status { get; set; }
    public string StatusText { get; set; } = string.Empty;
    public string? EquipmentInfo { get; set; }
}

public class MedicationDto
{
    public Guid Id { get; set; }
    public Guid ElderId { get; set; }
    public string DrugName { get; set; } = string.Empty;
    public string? GenericName { get; set; }
    public string? Specification { get; set; }
    public string? Dosage { get; set; }
    public string? Frequency { get; set; }
    public string? AdministrationRoute { get; set; }
    public string? UsageInstructions { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? PrescribingDoctor { get; set; }
    public string? Precautions { get; set; }
    public string? SideEffects { get; set; }
    public int? RemainingQuantity { get; set; }
    public string? StorageConditions { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateMedicationDto
{
    public Guid ElderId { get; set; }
    public string DrugName { get; set; } = string.Empty;
    public string? GenericName { get; set; }
    public string? Specification { get; set; }
    public string? Dosage { get; set; }
    public string? Frequency { get; set; }
    public string? AdministrationRoute { get; set; }
    public string? UsageInstructions { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? PrescribingDoctor { get; set; }
    public string? Precautions { get; set; }
    public string? SideEffects { get; set; }
    public int? RemainingQuantity { get; set; }
    public string? StorageConditions { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
}

public class ReviewRecordDto
{
    public Guid Id { get; set; }
    public ReviewType ReviewType { get; set; }
    public string ReviewTypeText { get; set; } = string.Empty;
    public Guid? ScheduleId { get; set; }
    public Guid? ExceptionRecordId { get; set; }
    public ReviewResult ReviewResult { get; set; }
    public string ReviewResultText { get; set; } = string.Empty;
    public string? ReviewComment { get; set; }
    public string? ImprovementSuggestions { get; set; }
    public CareStandard? CareStandardRating { get; set; }
    public string? CareStandardRatingText { get; set; }
    public string Reviewer { get; set; } = string.Empty;
    public string? ReviewerDepartment { get; set; }
    public DateTime? ReviewDueDate { get; set; }
    public DateTime ReviewedAt { get; set; }
    public bool IsFollowUpRequired { get; set; }
    public DateTime? FollowUpDueDate { get; set; }
    public string? FollowUpRequirements { get; set; }
    public bool FollowUpCompleted { get; set; }
}
