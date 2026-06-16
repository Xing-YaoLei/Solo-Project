using ElderCareScheduling.API.Enums;

namespace ElderCareScheduling.API.Models.DTOs;

public class ElderListDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public Gender Gender { get; set; }
    public string GenderText { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public int Age { get; set; }
    public string? IdCardNumber { get; set; }
    public string? PhoneNumber { get; set; }
    public string? CareLevelName { get; set; }
    public CareLevelType? CareLevelType { get; set; }
    public SourceType SourceType { get; set; }
    public string SourceTypeText { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ElderDetailDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public Gender Gender { get; set; }
    public string GenderText { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public int Age { get; set; }
    public string? IdCardNumber { get; set; }
    public string? PhoneNumber { get; set; }
    public string? EmergencyContact { get; set; }
    public string? EmergencyPhone { get; set; }
    public string? Address { get; set; }
    public string? MedicalHistory { get; set; }
    public string? AllergyInfo { get; set; }
    public string? DietaryRequirements { get; set; }
    public string? Notes { get; set; }
    public SourceType SourceType { get; set; }
    public string SourceTypeText { get; set; } = string.Empty;
    public string? SourceDetail { get; set; }
    public Guid? CareLevelId { get; set; }
    public CareLevelDto? CareLevel { get; set; }
    public List<MedicationDto> Medications { get; set; } = new();
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
}

public class CreateElderDto
{
    public string Name { get; set; } = string.Empty;
    public Gender Gender { get; set; }
    public DateTime DateOfBirth { get; set; }
    public string? IdCardNumber { get; set; }
    public string? PhoneNumber { get; set; }
    public string? EmergencyContact { get; set; }
    public string? EmergencyPhone { get; set; }
    public string? Address { get; set; }
    public string? MedicalHistory { get; set; }
    public string? AllergyInfo { get; set; }
    public string? DietaryRequirements { get; set; }
    public string? Notes { get; set; }
    public SourceType SourceType { get; set; }
    public string? SourceDetail { get; set; }
    public Guid? CareLevelId { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
}

public class UpdateElderDto
{
    public string? Name { get; set; }
    public Gender? Gender { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? IdCardNumber { get; set; }
    public string? PhoneNumber { get; set; }
    public string? EmergencyContact { get; set; }
    public string? EmergencyPhone { get; set; }
    public string? Address { get; set; }
    public string? MedicalHistory { get; set; }
    public string? AllergyInfo { get; set; }
    public string? DietaryRequirements { get; set; }
    public string? Notes { get; set; }
    public SourceType? SourceType { get; set; }
    public string? SourceDetail { get; set; }
    public Guid? CareLevelId { get; set; }
    public bool? IsActive { get; set; }
    public string UpdatedBy { get; set; } = string.Empty;
}

public class ElderQueryDto
{
    public int PageIndex { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Keyword { get; set; }
    public Gender? Gender { get; set; }
    public CareLevelType? CareLevelType { get; set; }
    public SourceType? SourceType { get; set; }
    public bool? IsActive { get; set; }
}
