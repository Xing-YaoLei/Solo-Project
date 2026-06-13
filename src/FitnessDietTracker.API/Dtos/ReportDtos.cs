namespace FitnessDietTracker.API.Dtos;

public class MonthlyReviewDto
{
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public int Year { get; set; }
    public int Month { get; set; }
    public BodyFatChangeDto BodyFatChange { get; set; } = new();
    public List<BodyMeasurementDto> MonthlyMeasurements { get; set; } = new();
    public int CheckInCount { get; set; }
    public int MissedDays { get; set; }
    public decimal AdherenceRate { get; set; }
}

public class BodyFatChangeDto
{
    public decimal StartBodyFat { get; set; }
    public decimal EndBodyFat { get; set; }
    public decimal Change { get; set; }
    public decimal ChangePercentage { get; set; }
    public decimal StartWeight { get; set; }
    public decimal EndWeight { get; set; }
    public decimal WeightChange { get; set; }
}
