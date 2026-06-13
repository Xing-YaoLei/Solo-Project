using FitnessDietTracker.API.Data;
using FitnessDietTracker.API.Dtos;
using FitnessDietTracker.API.Models;
using Microsoft.EntityFrameworkCore;

namespace FitnessDietTracker.API.Services;

public class DietRecordService : IDietRecordService
{
    private readonly AppDbContext _context;

    public DietRecordService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<DietRecordDto>> GetRecordsByUserAsync(int userId, DateTime? startDate, DateTime? endDate)
    {
        var query = _context.DietRecords
            .Include(d => d.User)
            .Include(d => d.Photos)
            .Include(d => d.CoachComment)
                .ThenInclude(c => c.Coach)
            .Where(d => d.UserId == userId);

        if (startDate.HasValue)
            query = query.Where(d => d.RecordDate >= startDate.Value);
        if (endDate.HasValue)
            query = query.Where(d => d.RecordDate <= endDate.Value);

        return await query
            .OrderByDescending(d => d.RecordDate)
            .Select(d => MapToDto(d))
            .ToListAsync();
    }

    public async Task<List<DietRecordDto>> GetRecordsWithDetailsAsync(int userId, DateTime? startDate, DateTime? endDate)
    {
        return await GetRecordsByUserAsync(userId, startDate, endDate);
    }

    public async Task<DietRecordDto?> GetByIdAsync(int id)
    {
        var record = await _context.DietRecords
            .Include(d => d.User)
            .Include(d => d.Photos)
            .Include(d => d.CoachComment)
                .ThenInclude(c => c.Coach)
            .FirstOrDefaultAsync(d => d.Id == id);

        return record != null ? MapToDto(record) : null;
    }

    public async Task<DietRecordDto> CreateAsync(DietRecordCreateDto dto)
    {
        var record = new DietRecord
        {
            UserId = dto.UserId,
            RecordDate = dto.RecordDate,
            MealType = dto.MealType,
            FoodItems = dto.FoodItems,
            Calories = dto.Calories,
            Protein = dto.Protein,
            Carbs = dto.Carbs,
            Fat = dto.Fat,
            Notes = dto.Notes,
            CreatedAt = DateTime.UtcNow
        };

        if (dto.PhotoUrls != null && dto.PhotoUrls.Any())
        {
            record.Photos = dto.PhotoUrls.Select(url => new CheckInPhoto
            {
                PhotoUrl = url,
                UploadedAt = DateTime.UtcNow
            }).ToList();
        }

        _context.DietRecords.Add(record);
        await _context.SaveChangesAsync();

        await _context.Entry(record).Reference(r => r.User).LoadAsync();
        return MapToDto(record);
    }

    public async Task<DietRecordDto?> UpdateAsync(int id, DietRecordUpdateDto dto)
    {
        var record = await _context.DietRecords
            .Include(d => d.Photos)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (record == null) return null;

        if (dto.MealType.HasValue) record.MealType = dto.MealType.Value;
        if (dto.FoodItems != null) record.FoodItems = dto.FoodItems;
        if (dto.Calories.HasValue) record.Calories = dto.Calories.Value;
        if (dto.Protein.HasValue) record.Protein = dto.Protein.Value;
        if (dto.Carbs.HasValue) record.Carbs = dto.Carbs.Value;
        if (dto.Fat.HasValue) record.Fat = dto.Fat.Value;
        if (dto.Notes != null) record.Notes = dto.Notes;
        record.UpdatedAt = DateTime.UtcNow;

        if (dto.RemovePhotoIds != null && dto.RemovePhotoIds.Any())
        {
            var photosToRemove = record.Photos.Where(p => dto.RemovePhotoIds.Contains(p.Id)).ToList();
            _context.CheckInPhotos.RemoveRange(photosToRemove);
        }

        if (dto.AddPhotoUrls != null && dto.AddPhotoUrls.Any())
        {
            foreach (var url in dto.AddPhotoUrls)
            {
                record.Photos.Add(new CheckInPhoto
                {
                    PhotoUrl = url,
                    UploadedAt = DateTime.UtcNow
                });
            }
        }

        await _context.SaveChangesAsync();
        await _context.Entry(record).Reference(r => r.User).LoadAsync();
        await _context.Entry(record).Collection(r => r.Photos).LoadAsync();
        await _context.Entry(record).Reference(r => r.CoachComment).LoadAsync();
        return MapToDto(record);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var record = await _context.DietRecords.FindAsync(id);
        if (record == null) return false;

        _context.DietRecords.Remove(record);
        await _context.SaveChangesAsync();
        return true;
    }

    private static DietRecordDto MapToDto(DietRecord d) => new()
    {
        Id = d.Id,
        UserId = d.UserId,
        UserName = d.User?.UserName ?? string.Empty,
        RecordDate = d.RecordDate,
        MealType = d.MealType,
        FoodItems = d.FoodItems,
        Calories = d.Calories,
        Protein = d.Protein,
        Carbs = d.Carbs,
        Fat = d.Fat,
        Notes = d.Notes,
        Photos = d.Photos?.Select(p => new CheckInPhotoDto
        {
            Id = p.Id,
            PhotoUrl = p.PhotoUrl,
            Description = p.Description,
            UploadedAt = p.UploadedAt
        }).ToList() ?? new(),
        CoachComment = d.CoachComment != null ? new CoachCommentDto
        {
            Id = d.CoachComment.Id,
            CoachId = d.CoachComment.CoachId,
            CoachName = d.CoachComment.Coach?.UserName ?? string.Empty,
            Comment = d.CoachComment.Comment,
            CreatedAt = d.CoachComment.CreatedAt,
            UpdatedAt = d.CoachComment.UpdatedAt
        } : null
    };
}
