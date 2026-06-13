using FitnessDietTracker.API.Data;
using FitnessDietTracker.API.Dtos;
using FitnessDietTracker.API.Models;
using Microsoft.EntityFrameworkCore;

namespace FitnessDietTracker.API.Services;

public class ReportService : IReportService
{
    private readonly AppDbContext _context;

    public ReportService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<MonthlyReviewDto> GetMonthlyReviewAsync(int userId, int year, int month)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) throw new KeyNotFoundException($"用户 {userId} 不存在");

        var monthStart = new DateTime(year, month, 1);
        var monthEnd = monthStart.AddMonths(1).AddDays(-1);

        var measurements = await _context.BodyMeasurements
            .Include(b => b.User)
            .Where(b => b.UserId == userId
                && b.MeasureDate >= monthStart
                && b.MeasureDate <= monthEnd)
            .OrderBy(b => b.MeasureDate)
            .ToListAsync();

        var first = measurements.FirstOrDefault();
        var last = measurements.LastOrDefault();

        var bodyFatChange = new BodyFatChangeDto
        {
            StartBodyFat = first?.BodyFatPercentage ?? 0,
            EndBodyFat = last?.BodyFatPercentage ?? 0,
            Change = (last?.BodyFatPercentage ?? 0) - (first?.BodyFatPercentage ?? 0),
            ChangePercentage = first != null && first.BodyFatPercentage != 0
                ? ((last?.BodyFatPercentage ?? 0) - first.BodyFatPercentage) / first.BodyFatPercentage * 100
                : 0,
            StartWeight = first?.Weight ?? 0,
            EndWeight = last?.Weight ?? 0,
            WeightChange = (last?.Weight ?? 0) - (first?.Weight ?? 0)
        };

        var checkInRecords = await _context.DietRecords
            .Where(d => d.UserId == userId
                && d.RecordDate >= monthStart
                && d.RecordDate <= monthEnd)
            .Select(d => d.RecordDate.Date)
            .Distinct()
            .ToListAsync();

        var totalDays = (monthEnd - monthStart).Days + 1;
        var checkInCount = checkInRecords.Count;
        var missedDays = totalDays - checkInCount;

        return new MonthlyReviewDto
        {
            UserId = userId,
            UserName = user.UserName,
            Year = year,
            Month = month,
            BodyFatChange = bodyFatChange,
            MonthlyMeasurements = measurements.Select(MapToMeasurementDto).ToList(),
            CheckInCount = checkInCount,
            MissedDays = missedDays,
            AdherenceRate = totalDays > 0 ? (decimal)checkInCount / totalDays * 100 : 0
        };
    }

    private static BodyMeasurementDto MapToMeasurementDto(BodyMeasurement b) => new()
    {
        Id = b.Id,
        UserId = b.UserId,
        UserName = b.User?.UserName ?? string.Empty,
        MeasureDate = b.MeasureDate,
        Weight = b.Weight,
        BodyFatPercentage = b.BodyFatPercentage,
        MuscleMass = b.MuscleMass,
        Bmi = b.Bmi,
        Waist = b.Waist,
        Hip = b.Hip,
        Chest = b.Chest,
        Biceps = b.Biceps,
        Thigh = b.Thigh,
        Notes = b.Notes
    };
}
