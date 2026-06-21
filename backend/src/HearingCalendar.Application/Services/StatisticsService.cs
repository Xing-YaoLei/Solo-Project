using HearingCalendar.Application.Dtos;
using HearingCalendar.Application.Interfaces;
using HearingCalendar.Domain.Entities;
using HearingCalendar.Domain.Enums;
using HearingCalendar.Infrastructure.Data;
using HearingCalendar.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace HearingCalendar.Application.Services;

public class StatisticsService : IStatisticsService
{
    private readonly IRepository<HearingSchedule> _hearingRepo;
    private readonly IRepository<ClientFeedback> _feedbackRepo;
    private readonly IRepository<ConflictOfInterest> _conflictRepo;
    private readonly HearingCalendarDbContext _dbContext;

    public StatisticsService(
        IRepository<HearingSchedule> hearingRepo,
        IRepository<ClientFeedback> feedbackRepo,
        IRepository<ConflictOfInterest> conflictRepo,
        HearingCalendarDbContext dbContext)
    {
        _hearingRepo = hearingRepo;
        _feedbackRepo = feedbackRepo;
        _conflictRepo = conflictRepo;
        _dbContext = dbContext;
    }

    public async Task<StatisticsOverviewResponse> GetOverviewAsync(DateOnly? from = null, DateOnly? to = null, Guid? callerUserId = null)
    {
        var query = _dbContext.HearingSchedules.AsQueryable();

        if (callerUserId.HasValue)
        {
            var caller = await _dbContext.Users.FindAsync(callerUserId.Value);
            if (caller?.Role == UserRole.Client)
            {
                query = query.Where(h => h.Participants.Any(p => p.UserId == callerUserId.Value));
            }
        }

        if (from.HasValue) query = query.Where(h => h.HearingDate >= from.Value);
        if (to.HasValue) query = query.Where(h => h.HearingDate <= to.Value);

        var hearings = await query.ToListAsync();

        var feedbackQuery = _dbContext.ClientFeedbacks.AsQueryable();
        if (callerUserId.HasValue)
        {
            var caller = await _dbContext.Users.FindAsync(callerUserId.Value);
            if (caller?.Role == UserRole.Client)
            {
                feedbackQuery = feedbackQuery.Where(f => f.ClientId == callerUserId.Value);
            }
        }
        if (from.HasValue) feedbackQuery = feedbackQuery.Where(f => f.SubmittedAt >= from.Value.ToDateTime(TimeOnly.MinValue));
        if (to.HasValue) feedbackQuery = feedbackQuery.Where(f => f.SubmittedAt <= to.Value.ToDateTime(TimeOnly.MaxValue));

        var feedbacks = await feedbackQuery.ToListAsync();

        var conflictQuery = _dbContext.ConflictsOfInterest.AsQueryable();
        if (callerUserId.HasValue)
        {
            var caller = await _dbContext.Users.FindAsync(callerUserId.Value);
            if (caller?.Role == UserRole.Client)
            {
                conflictQuery = conflictQuery.Where(c =>
                    c.Hearing.Participants.Any(p => p.UserId == callerUserId.Value));
            }
        }
        if (from.HasValue) conflictQuery = conflictQuery.Where(c => c.DetectedAt >= from.Value.ToDateTime(TimeOnly.MinValue));
        if (to.HasValue) conflictQuery = conflictQuery.Where(c => c.DetectedAt <= to.Value.ToDateTime(TimeOnly.MaxValue));

        var conflictCount = await conflictQuery.CountAsync();

        var now = DateTime.UtcNow;
        var thisMonthStart = new DateOnly(now.Year, now.Month, 1);
        var thisWeekStart = DateOnly.FromDateTime(now.AddDays(-(int)now.DayOfWeek));

        var allQuery = _dbContext.HearingSchedules.AsQueryable();
        if (callerUserId.HasValue)
        {
            var caller = await _dbContext.Users.FindAsync(callerUserId.Value);
            if (caller?.Role == UserRole.Client)
            {
                allQuery = allQuery.Where(h => h.Participants.Any(p => p.UserId == callerUserId.Value));
            }
        }
        var allHearings = await allQuery.ToListAsync();
        var hearingsThisMonth = allHearings.Count(h => h.HearingDate >= thisMonthStart);
        var hearingsThisWeek = allHearings.Count(h => h.HearingDate >= thisWeekStart);

        return new StatisticsOverviewResponse(
            hearings.Count,
            hearings.Count(h => h.Status == HearingStatus.Completed),
            hearings.Count(h => h.Status == HearingStatus.Cancelled),
            conflictCount,
            feedbacks.Count > 0 ? Math.Round(feedbacks.Average(f => f.SatisfactionScore), 2) : 0,
            hearingsThisMonth,
            hearingsThisWeek);
    }

    public async Task<IEnumerable<ClientSatisfactionReport>> GetClientSatisfactionAsync(DateOnly? from = null, DateOnly? to = null, Guid? callerUserId = null)
    {
        var query = _dbContext.ClientFeedbacks
            .Include(f => f.Client)
            .Include(f => f.Hearing)
            .AsQueryable();

        if (callerUserId.HasValue)
        {
            var caller = await _dbContext.Users.FindAsync(callerUserId.Value);
            if (caller?.Role == UserRole.Client)
            {
                query = query.Where(f => f.ClientId == callerUserId.Value);
            }
        }

        if (from.HasValue) query = query.Where(f => f.SubmittedAt >= from.Value.ToDateTime(TimeOnly.MinValue));
        if (to.HasValue) query = query.Where(f => f.SubmittedAt <= to.Value.ToDateTime(TimeOnly.MaxValue));

        var feedbacks = await query.ToListAsync();

        return feedbacks
            .GroupBy(f => f.ClientId)
            .Select(g =>
            {
                var client = g.First().Client;
                return new ClientSatisfactionReport(
                    g.Key,
                    client?.FullName ?? string.Empty,
                    Math.Round(g.Average(f => f.SatisfactionScore), 2),
                    g.Count(),
                    g.Select(f => new FeedbackDetail(
                        f.HearingId,
                        f.Hearing?.CaseNumber ?? string.Empty,
                        f.SatisfactionScore,
                        f.Comments,
                        f.SubmittedAt)).ToList());
            });
    }

    public async Task<IEnumerable<HearingStatistics>> GetHearingStatisticsAsync(DateOnly from, DateOnly to, Guid? callerUserId = null)
    {
        var query = _dbContext.HearingSchedules
            .Where(h => h.HearingDate >= from && h.HearingDate <= to);

        if (callerUserId.HasValue)
        {
            var caller = await _dbContext.Users.FindAsync(callerUserId.Value);
            if (caller?.Role == UserRole.Client)
            {
                query = query.Where(h => h.Participants.Any(p => p.UserId == callerUserId.Value));
            }
        }

        var hearings = await query.ToListAsync();
        var hearingIds = hearings.Select(h => h.Id).ToList();

        var conflictQuery = _dbContext.ConflictsOfInterest
            .Where(c => c.DetectedAt >= from.ToDateTime(TimeOnly.MinValue)
                     && c.DetectedAt <= to.ToDateTime(TimeOnly.MaxValue));

        if (callerUserId.HasValue)
        {
            var caller = await _dbContext.Users.FindAsync(callerUserId.Value);
            if (caller?.Role == UserRole.Client)
            {
                conflictQuery = conflictQuery.Where(c => hearingIds.Contains(c.HearingId));
            }
        }

        var conflicts = await conflictQuery.ToListAsync();

        return hearings
            .GroupBy(h => h.HearingDate)
            .OrderBy(g => g.Key)
            .Select(g =>
            {
                var dateConflicts = conflicts.Count(c => DateOnly.FromDateTime(c.DetectedAt) == g.Key);
                return new HearingStatistics(
                    g.Key,
                    g.Count(),
                    g.Count(h => h.Status == HearingStatus.Completed),
                    g.Count(h => h.Status == HearingStatus.Cancelled),
                    dateConflicts);
            });
    }

    public async Task<ClientSatisfactionReport> GetClientSatisfactionDetailAsync(Guid clientId, Guid? callerUserId = null)
    {
        var query = _dbContext.ClientFeedbacks
            .Include(f => f.Client)
            .Include(f => f.Hearing)
            .Where(f => f.ClientId == clientId);

        if (callerUserId.HasValue)
        {
            var caller = await _dbContext.Users.FindAsync(callerUserId.Value);
            if (caller?.Role == UserRole.Client && callerUserId.Value != clientId)
            {
                throw new UnauthorizedAccessException("You can only view your own satisfaction data");
            }
        }

        var feedbacks = await query.ToListAsync();

        if (feedbacks.Count == 0)
            throw new KeyNotFoundException($"No feedbacks found for client {clientId}");

        var client = feedbacks.First().Client;

        return new ClientSatisfactionReport(
            clientId,
            client?.FullName ?? string.Empty,
            Math.Round(feedbacks.Average(f => f.SatisfactionScore), 2),
            feedbacks.Count,
            feedbacks.Select(f => new FeedbackDetail(
                f.HearingId,
                f.Hearing?.CaseNumber ?? string.Empty,
                f.SatisfactionScore,
                f.Comments,
                f.SubmittedAt)).ToList());
    }
}
