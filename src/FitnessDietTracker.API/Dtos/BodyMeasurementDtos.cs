namespace FitnessDietTracker.API.Dtos;

public class BodyMeasurementCreateDto
{
    public int UserId { get; set; }
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
}

public class BodyMeasurementUpdateDto
{
    public DateTime? MeasureDate { get; set; }
    public decimal? Weight { get; set; }
    public decimal? BodyFatPercentage { get; set; }
    public decimal? MuscleMass { get; set; }
    public decimal? Bmi { get; set; }
    public decimal? Waist { get; set; }
    public decimal? Hip { get; set; }
    public decimal? Chest { get; set; }
    public decimal? Biceps { get; set; }
    public decimal? Thigh { get; set; }
    public string? Notes { get; set; }
}

public class BodyMeasurementDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
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
}
