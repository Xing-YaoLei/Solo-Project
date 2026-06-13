namespace FitnessDietTracker.API.Models;

public class CheckInPhoto
{
    public int Id { get; set; }
    public int DietRecordId { get; set; }
    public DietRecord DietRecord { get; set; } = null!;
    public string PhotoUrl { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
}
