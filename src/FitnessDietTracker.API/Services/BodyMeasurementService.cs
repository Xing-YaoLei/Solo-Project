using FitnessDietTracker.API.Data;
using FitnessDietTracker.API.Dtos;
using FitnessDietTracker.API.Models;
using Microsoft.EntityFrameworkCore;

namespace FitnessDietTracker.API.Services;

public class BodyMeasurementService : IBodyMeasurementService
{
    private readonly AppDbContext _context;

    public BodyMeasurementService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<BodyMeasurementDto>> GetByUserAsync(int userId, DateTime? startDate, DateTime? endDate)
    {
        var query = _context.BodyMeasurements
            .Include(b => b.User)
            .Where(b => b.UserId == userId);

        if (startDate.HasValue)
            query = query.Where(b => b.MeasureDate >= startDate.Value);
        if (endDate.HasValue)
            query = query.Where(b => b.MeasureDate <= endDate.Value);

        return await query
            .OrderByDescending(b => b.MeasureDate)
            .Select(b => MapToDto(b))
            .ToListAsync();
    }

    public async Task<BodyMeasurementDto?> GetByIdAsync(int id)
    {
        var measurement = await _context.BodyMeasurements
            .Include(b => b.User)
            .FirstOrDefaultAsync(b => b.Id == id);
        return measurement != null ? MapToDto(measurement) : null;
    }

    public async Task<BodyMeasurementDto> CreateAsync(BodyMeasurementCreateDto dto)
    {
        var measurement = new BodyMeasurement
        {
            UserId = dto.UserId,
            MeasureDate = dto.MeasureDate,
            Weight = dto.Weight,
            BodyFatPercentage = dto.BodyFatPercentage,
            MuscleMass = dto.MuscleMass,
            Bmi = dto.Bmi,
            Waist = dto.Waist,
            Hip = dto.Hip,
            Chest = dto.Chest,
            Biceps = dto.Biceps,
            Thigh = dto.Thigh,
            Notes = dto.Notes,
            CreatedAt = DateTime.UtcNow
        };

        _context.BodyMeasurements.Add(measurement);
        await _context.SaveChangesAsync();
        await _context.Entry(measurement).Reference(m => m.User).LoadAsync();
        return MapToDto(measurement);
    }

    public async Task<BodyMeasurementDto?> UpdateAsync(int id, BodyMeasurementUpdateDto dto)
    {
        var measurement = await _context.BodyMeasurements.FindAsync(id);
        if (measurement == null) return null;

        if (dto.MeasureDate.HasValue) measurement.MeasureDate = dto.MeasureDate.Value;
        if (dto.Weight.HasValue) measurement.Weight = dto.Weight.Value;
        if (dto.BodyFatPercentage.HasValue) measurement.BodyFatPercentage = dto.BodyFatPercentage.Value;
        if (dto.MuscleMass.HasValue) measurement.MuscleMass = dto.MuscleMass.Value;
        if (dto.Bmi.HasValue) measurement.Bmi = dto.Bmi.Value;
        if (dto.Waist.HasValue) measurement.Waist = dto.Waist.Value;
        if (dto.Hip.HasValue) measurement.Hip = dto.Hip.Value;
        if (dto.Chest.HasValue) measurement.Chest = dto.Chest.Value;
        if (dto.Biceps.HasValue) measurement.Biceps = dto.Biceps.Value;
        if (dto.Thigh.HasValue) measurement.Thigh = dto.Thigh.Value;
        if (dto.Notes != null) measurement.Notes = dto.Notes;
        measurement.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        await _context.Entry(measurement).Reference(m => m.User).LoadAsync();
        return MapToDto(measurement);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var measurement = await _context.BodyMeasurements.FindAsync(id);
        if (measurement == null) return false;

        _context.BodyMeasurements.Remove(measurement);
        await _context.SaveChangesAsync();
        return true;
    }

    private static BodyMeasurementDto MapToDto(BodyMeasurement b) => new()
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
