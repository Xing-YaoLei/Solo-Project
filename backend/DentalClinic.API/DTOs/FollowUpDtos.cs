using DentalClinic.API.Enums;

namespace DentalClinic.API.DTOs;

public class FollowUpTaskDto
{
    public int Id { get; set; }
    public int PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string? PatientPhone { get; set; }
    public int? AppointmentId { get; set; }
    public int? TreatmentPlanId { get; set; }
    public FollowUpType Type { get; set; }
    public FollowUpStatus Status { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Content { get; set; }
    public string? Result { get; set; }
    public DateTime? ScheduledDate { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? AssignedTo { get; set; }
    public string? CompletedBy { get; set; }
    public string? Remarks { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateFollowUpTaskDto
{
    public int PatientId { get; set; }
    public int? AppointmentId { get; set; }
    public int? TreatmentPlanId { get; set; }
    public FollowUpType Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Content { get; set; }
    public DateTime? ScheduledDate { get; set; }
    public string? AssignedTo { get; set; }
    public string? Remarks { get; set; }
}

public class UpdateFollowUpTaskDto
{
    public FollowUpStatus? Status { get; set; }
    public string? Title { get; set; }
    public string? Content { get; set; }
    public string? Result { get; set; }
    public DateTime? ScheduledDate { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? AssignedTo { get; set; }
    public string? CompletedBy { get; set; }
    public string? Remarks { get; set; }
}
