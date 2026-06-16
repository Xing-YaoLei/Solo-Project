namespace DentalClinic.API.DTOs;

public class ImageAttachmentDto
{
    public int Id { get; set; }
    public int PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public int? AppointmentId { get; set; }
    public int? TreatmentPlanId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string? FilePath { get; set; }
    public string? FileType { get; set; }
    public long FileSize { get; set; }
    public string? Description { get; set; }
    public string? Category { get; set; }
    public DateTime UploadedAt { get; set; }
    public string? UploadedBy { get; set; }
}

public class UploadImageDto
{
    public int PatientId { get; set; }
    public int? AppointmentId { get; set; }
    public int? TreatmentPlanId { get; set; }
    public string? Description { get; set; }
    public string? Category { get; set; }
    public string? UploadedBy { get; set; }
}
