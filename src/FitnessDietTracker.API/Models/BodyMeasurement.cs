namespace FitnessDietTracker.API.Models;

public class BodyMeasurement
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public DateTime MeasureDate { get; set; }
    public decimal Weight { get; set; }
    public decimal BodyFatPercentage { get; set; }
    public decimal? MuscleMass { get; set; }
    public decimal? Bmi { get; set; }
    public decimal? Waist { get; set; }
    public decimal? Hip { get; set; }
    public decimal? Chest { get; set; }
    public decimal? Biceps { get; set; }
    public decimal? Thigh { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
