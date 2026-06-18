using CarServiceAppointment.API.Models;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace CarServiceAppointment.API.DTOs;

public class InspectionPhotoDto
{
    public int Id { get; set; }
    public int AppointmentId { get; set; }
    public string PhotoUrl { get; set; } = string.Empty;
    [JsonConverter(typeof(StringEnumConverter))]
    public PhotoType PhotoType { get; set; }
    public DateTime UploadTime { get; set; }
    public string? Uploader { get; set; }
    public string? Remarks { get; set; }
}

public class UploadPhotoDto
{
    public int AppointmentId { get; set; }
    public string PhotoUrl { get; set; } = string.Empty;
    [JsonConverter(typeof(StringEnumConverter))]
    public PhotoType PhotoType { get; set; }
    public string? Uploader { get; set; }
    public string? Remarks { get; set; }
}
