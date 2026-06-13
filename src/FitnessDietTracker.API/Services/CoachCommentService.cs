using FitnessDietTracker.API.Data;
using FitnessDietTracker.API.Dtos;
using FitnessDietTracker.API.Models;
using Microsoft.EntityFrameworkCore;

namespace FitnessDietTracker.API.Services;

public class CoachCommentService : ICoachCommentService
{
    private readonly AppDbContext _context;

    public CoachCommentService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<CoachCommentDto?> GetByDietRecordIdAsync(int dietRecordId)
    {
        var comment = await _context.CoachComments
            .Include(c => c.Coach)
            .FirstOrDefaultAsync(c => c.DietRecordId == dietRecordId);
        return comment != null ? MapToDto(comment) : null;
    }

    public async Task<List<CoachCommentHistoryDto>> GetHistoryAsync(int commentId)
    {
        return await _context.CoachCommentHistories
            .Where(h => h.CoachCommentId == commentId)
            .OrderByDescending(h => h.ChangedAt)
            .Select(h => new CoachCommentHistoryDto
            {
                Id = h.Id,
                OldValue = h.OldValue,
                NewValue = h.NewValue,
                ChangedBy = h.ChangedBy,
                ChangedByName = _context.Users
                    .Where(u => u.Id == h.ChangedBy)
                    .Select(u => u.UserName)
                    .FirstOrDefault() ?? string.Empty,
                ChangedAt = h.ChangedAt
            })
            .ToListAsync();
    }

    public async Task<CoachCommentDto> CreateAsync(CoachCommentCreateDto dto)
    {
        var existing = await _context.CoachComments
            .FirstOrDefaultAsync(c => c.DietRecordId == dto.DietRecordId);

        if (existing != null)
            throw new InvalidOperationException("该饮食记录已有点评，请使用更新操作");

        var comment = new CoachComment
        {
            DietRecordId = dto.DietRecordId,
            CoachId = dto.CoachId,
            Comment = dto.Comment,
            CreatedAt = DateTime.UtcNow
        };

        _context.CoachComments.Add(comment);

        var history = new CoachCommentHistory
        {
            CoachComment = comment,
            OldValue = string.Empty,
            NewValue = dto.Comment,
            ChangedBy = dto.CoachId,
            ChangedAt = DateTime.UtcNow
        };
        _context.CoachCommentHistories.Add(history);

        await _context.SaveChangesAsync();
        await _context.Entry(comment).Reference(c => c.Coach).LoadAsync();
        return MapToDto(comment);
    }

    public async Task<CoachCommentDto?> UpdateAsync(int id, CoachCommentUpdateDto dto, int operatorId)
    {
        var comment = await _context.CoachComments
            .Include(c => c.Coach)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (comment == null) return null;

        var oldValue = comment.Comment;
        comment.Comment = dto.Comment;
        comment.UpdatedAt = DateTime.UtcNow;

        var history = new CoachCommentHistory
        {
            CoachCommentId = id,
            OldValue = oldValue,
            NewValue = dto.Comment,
            ChangedBy = operatorId,
            ChangedAt = DateTime.UtcNow
        };
        _context.CoachCommentHistories.Add(history);

        await _context.SaveChangesAsync();
        return MapToDto(comment);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var comment = await _context.CoachComments.FindAsync(id);
        if (comment == null) return false;

        _context.CoachComments.Remove(comment);
        await _context.SaveChangesAsync();
        return true;
    }

    private static CoachCommentDto MapToDto(CoachComment c) => new()
    {
        Id = c.Id,
        CoachId = c.CoachId,
        CoachName = c.Coach?.UserName ?? string.Empty,
        Comment = c.Comment,
        CreatedAt = c.CreatedAt,
        UpdatedAt = c.UpdatedAt
    };
}
