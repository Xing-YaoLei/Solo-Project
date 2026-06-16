using DentalClinic.API.Enums;

namespace DentalClinic.API.DTOs;

public class PatientDto
{
    public int Id { get; set; }
    public string PatientNo { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public Gender Gender { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Address { get; set; }
    public MemberLevel MemberLevel { get; set; }
    public string? MedicalHistory { get; set; }
    public string? AllergyHistory { get; set; }
    public string? Remarks { get; set; }
    public DateTime CreatedAt { get; set; }
    public int NoShowCount { get; set; }
    public int TotalAppointments { get; set; }
}

public class CreatePatientDto
{
    public string Name { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public Gender Gender { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Address { get; set; }
    public MemberLevel MemberLevel { get; set; }
    public string? MedicalHistory { get; set; }
    public string? AllergyHistory { get; set; }
    public string? Remarks { get; set; }
}

public class UpdatePatientDto
{
    public string Name { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public Gender Gender { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Address { get; set; }
    public MemberLevel MemberLevel { get; set; }
    public string? MedicalHistory { get; set; }
    public string? AllergyHistory { get; set; }
    public string? Remarks { get; set; }
}

public class PatientSummaryDto
{
    public int Id { get; set; }
    public string PatientNo { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public MemberLevel MemberLevel { get; set; }
    public int NoShowCount { get; set; }
    public int TotalAppointments { get; set; }
    public RiskLevel RiskLevel => CalculateRiskLevel();

    private RiskLevel CalculateRiskLevel()
    {
        if (TotalAppointments == 0) return RiskLevel.Low;
        var noShowRate = (double)NoShowCount / TotalAppointments;
        if (noShowRate >= 0.5) return RiskLevel.Critical;
        if (noShowRate >= 0.3) return RiskLevel.High;
        if (noShowRate >= 0.15) return RiskLevel.Medium;
        return RiskLevel.Low;
    }
}
