using Microsoft.EntityFrameworkCore;
using AutoRepair.Application.DTOs;
using AutoRepair.Application.Interfaces;
using AutoRepair.Domain.Entities;

namespace AutoRepair.Application.Services;

public class ReviewOpinionService : IReviewOpinionService
{
    private readonly IAppDbContext _context;

    public ReviewOpinionService(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<ReviewOpinionDto> AddAsync(ReviewOpinionCreateDto dto, string reviewerUserId)
    {
        var reviewOpinion = new ReviewOpinion
        {
            Id = Guid.NewGuid(),
            QuoteId = dto.QuoteId,
            WorkOrderId = dto.WorkOrderId,
            ReviewerUserId = reviewerUserId,
            Opinion = dto.Opinion,
            IsApproved = dto.IsApproved,
            ReviewedAt = DateTime.UtcNow
        };

        _context.ReviewOpinions.Add(reviewOpinion);
        await _context.SaveChangesAsync();

        var saved = await _context.ReviewOpinions
            .Include(r => r.ReviewerUser)
            .Include(r => r.Quote)
            .Include(r => r.WorkOrder)
            .FirstOrDefaultAsync(r => r.Id == reviewOpinion.Id);

        return MapToDto(saved ?? reviewOpinion);
    }

    private static ReviewOpinionDto MapToDto(ReviewOpinion r) => new()
    {
        Id = r.Id,
        ReviewerUserId = r.ReviewerUserId,
        ReviewerUserName = r.ReviewerUser?.FullName ?? string.Empty,
        Opinion = r.Opinion,
        IsApproved = r.IsApproved,
        ReviewedAt = r.ReviewedAt
    };
}
