using DentalClinic.API.Enums;

namespace DentalClinic.API.DTOs;

public class AppointmentDto
{
    public int Id { get; set; }
    public int PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string PatientPhone { get; set; } = string.Empty;
    public int? TreatmentPlanId { get; set; }
    public string? TreatmentPlanName { get; set; }
    public DateTime AppointmentDate { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public string? Subject { get; set; }
    public string? Description { get; set; }
    public AppointmentStatus Status { get; set; }
    public string? DoctorName { get; set; }
    public string? AssistantName { get; set; }
    public string? ChairNumber { get; set; }
    public RiskLevel RiskLevel { get; set; }
    public int? NoShowCount { get; set; }
    public string? CommunicationNotes { get; set; }
    public string? ReviewComments { get; set; }
    public DateTime? ReminderSentAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateAppointmentDto
{
    public int PatientId { get; set; }
    public int? TreatmentPlanId { get; set; }
    public DateTime AppointmentDate { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public string? Subject { get; set; }
    public string? Description { get; set; }
    public string? DoctorName { get; set; }
    public string? AssistantName { get; set; }
    public string? ChairNumber { get; set; }
}

public class UpdateAppointmentDto
{
    public DateTime? AppointmentDate { get; set; }
    public TimeSpan? StartTime { get; set; }
    public TimeSpan? EndTime { get; set; }
    public string? Subject { get; set; }
    public string? Description { get; set; }
    public AppointmentStatus? Status { get; set; }
    public string? DoctorName { get; set; }
    public string? AssistantName { get; set; }
    public string? ChairNumber { get; set; }
    public string? CommunicationNotes { get; set; }
    public string? ReviewComments { get; set; }
}

public class AppointmentListDto
{
    public int Id { get; set; }
    public int PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string PatientPhone { get; set; } = string.Empty;
    public MemberLevel MemberLevel { get; set; }
    public DateTime AppointmentDate { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public string? Subject { get; set; }
    public AppointmentStatus Status { get; set; }
    public RiskLevel RiskLevel { get; set; }
    public string? DoctorName { get; set; }
    public string? ChairNumber { get; set; }
    public int PatientNoShowCount { get; set; }
    public bool HasTreatmentPlan { get; set; }
    public bool HasFollowUpTasks { get; set; }
    public bool HasImages { get; set; }
    public bool HasBilling { get; set; }
}

public class AppointmentDetailDto
{
    public int Id { get; set; }
    public int PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string PatientPhone { get; set; } = string.Empty;
    public string? PatientEmail { get; set; }
    public Gender PatientGender { get; set; }
    public MemberLevel MemberLevel { get; set; }
    public int PatientNoShowCount { get; set; }
    public int PatientTotalAppointments { get; set; }

    public int? TreatmentPlanId { get; set; }
    public string? TreatmentPlanName { get; set; }
    public TreatmentStatus? TreatmentPlanStatus { get; set; }

    public DateTime AppointmentDate { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public string? Subject { get; set; }
    public string? Description { get; set; }
    public AppointmentStatus Status { get; set; }
    public string? DoctorName { get; set; }
    public string? AssistantName { get; set; }
    public string? ChairNumber { get; set; }
    public RiskLevel RiskLevel { get; set; }
    public string? CommunicationNotes { get; set; }
    public string? ReviewComments { get; set; }

    public List<TreatmentPlanItemDto>? PlanItems { get; set; }
    public List<FollowUpTaskDto>? FollowUpTasks { get; set; }
    public List<ImageAttachmentDto>? ImageAttachments { get; set; }
    public List<BillingRecordDto>? BillingRecords { get; set; }
}

public class NoShowAppointmentDto
{
    public int Id { get; set; }
    public int PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string PatientPhone { get; set; } = string.Empty;
    public MemberLevel MemberLevel { get; set; }
    public DateTime AppointmentDate { get; set; }
    public TimeSpan StartTime { get; set; }
    public RiskLevel RiskLevel { get; set; }
    public int PatientNoShowCount { get; set; }
    public string? CommunicationNotes { get; set; }
    public string? ReviewComments { get; set; }
    public bool HasFollowUp { get; set; }
}
