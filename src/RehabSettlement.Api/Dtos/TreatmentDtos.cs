namespace RehabSettlement.Api.Dtos;

public class TreatmentCalendarDto
{
    public int Id { get; set; }
    public int BillId { get; set; }
    public int PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public DateOnly TreatmentDate { get; set; }
    public TimeOnly? StartTime { get; set; }
    public TimeOnly? EndTime { get; set; }
    public string? TreatmentType { get; set; }
    public string? TreatmentItem { get; set; }
    public int? DoctorId { get; set; }
    public string? DoctorName { get; set; }
    public int? TherapistId { get; set; }
    public string? TherapistName { get; set; }
    public int StatusId { get; set; }
    public string StatusName { get; set; } = string.Empty;
    public int? Duration { get; set; }
    public string? Remark { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateTreatmentCalendarDto
{
    public int BillId { get; set; }
    public int PatientId { get; set; }
    public DateOnly TreatmentDate { get; set; }
    public TimeOnly? StartTime { get; set; }
    public TimeOnly? EndTime { get; set; }
    public string? TreatmentType { get; set; }
    public string? TreatmentItem { get; set; }
    public int? DoctorId { get; set; }
    public int? TherapistId { get; set; }
    public int? Duration { get; set; }
    public string? Remark { get; set; }
}

public class UpdateTreatmentCalendarDto
{
    public DateOnly? TreatmentDate { get; set; }
    public TimeOnly? StartTime { get; set; }
    public TimeOnly? EndTime { get; set; }
    public string? TreatmentType { get; set; }
    public string? TreatmentItem { get; set; }
    public int? DoctorId { get; set; }
    public int? TherapistId { get; set; }
    public int? StatusId { get; set; }
    public int? Duration { get; set; }
    public string? Remark { get; set; }
}

public class DeviceDto
{
    public int Id { get; set; }
    public string DeviceCode { get; set; } = string.Empty;
    public string DeviceName { get; set; } = string.Empty;
    public string? DeviceType { get; set; }
    public string? Model { get; set; }
    public int StatusId { get; set; }
    public string StatusName { get; set; } = string.Empty;
    public string? Location { get; set; }
}

public class DeviceUsageRecordDto
{
    public int Id { get; set; }
    public int DeviceId { get; set; }
    public string DeviceName { get; set; } = string.Empty;
    public int? BillId { get; set; }
    public int? TreatmentCalendarId { get; set; }
    public DateOnly UseDate { get; set; }
    public TimeOnly? StartTime { get; set; }
    public TimeOnly? EndTime { get; set; }
    public int? Duration { get; set; }
    public string? Remark { get; set; }
}

public class NursingLogDto
{
    public int Id { get; set; }
    public int? BillId { get; set; }
    public int PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public int? TreatmentCalendarId { get; set; }
    public DateOnly LogDate { get; set; }
    public TimeOnly? LogTime { get; set; }
    public int? NurseId { get; set; }
    public string? NurseName { get; set; }
    public string? VitalSigns { get; set; }
    public string? NursingContent { get; set; }
    public string? PatientCondition { get; set; }
    public string? Remark { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateNursingLogDto
{
    public int? BillId { get; set; }
    public int PatientId { get; set; }
    public int? TreatmentCalendarId { get; set; }
    public DateOnly LogDate { get; set; }
    public TimeOnly? LogTime { get; set; }
    public int? NurseId { get; set; }
    public string? VitalSigns { get; set; }
    public string? NursingContent { get; set; }
    public string? PatientCondition { get; set; }
    public string? Remark { get; set; }
}
