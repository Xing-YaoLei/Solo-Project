using Microsoft.EntityFrameworkCore;
using SiteSchedule.Data;
using SiteSchedule.Dtos.Statistics;
using SiteSchedule.Models;

namespace SiteSchedule.Services;

public class StatisticsService : IStatisticsService
{
    private readonly AppDbContext _context;

    public StatisticsService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<StatisticsOverviewDto> GetOverviewAsync()
    {
        var sites = await _context.ConstructionSites.ToListAsync();
        var requiredMaterials = await _context.AttachmentMaterials
            .Where(m => m.IsRequired)
            .CountAsync();

        var totalMaterialRelations = sites.Count * requiredMaterials;
        var submittedMaterials = await _context.MaterialSubmissions
            .Where(m => m.Status != SubmissionStatus.Pending)
            .CountAsync();
        var approvedMaterials = await _context.MaterialSubmissions
            .Where(m => m.Status == SubmissionStatus.Approved)
            .CountAsync();
        var missingMaterials = totalMaterialRelations - submittedMaterials;
        if (missingMaterials < 0) missingMaterials = 0;

        var pendingNotifications = await _context.NotificationRecords
            .Where(n => n.Status == NotificationStatus.Pending || n.Status == NotificationStatus.Sent)
            .CountAsync();

        var todayNotifications = await _context.NotificationRecords
            .Where(n => n.CreatedAt >= DateTime.Today)
            .CountAsync();

        return new StatisticsOverviewDto
        {
            TotalSites = sites.Count,
            PendingSites = sites.Count(s => s.Status == SiteStatus.Pending),
            InProgressSites = sites.Count(s => s.Status == SiteStatus.InProgress),
            ToBeConfirmedSites = sites.Count(s => s.Status == SiteStatus.ToBeConfirmed),
            ConfirmedSites = sites.Count(s => s.Status == SiteStatus.Confirmed),
            CompletedSites = sites.Count(s => s.Status == SiteStatus.Completed),
            TotalMaterials = totalMaterialRelations,
            SubmittedMaterials = submittedMaterials,
            ApprovedMaterials = approvedMaterials,
            MissingMaterials = missingMaterials,
            OverallCompleteRate = totalMaterialRelations > 0 ? (double)submittedMaterials / totalMaterialRelations * 100 : 0,
            OverallApprovedRate = totalMaterialRelations > 0 ? (double)approvedMaterials / totalMaterialRelations * 100 : 0,
            PendingNotifications = pendingNotifications,
            TodayNotifications = todayNotifications
        };
    }

    public async Task<List<MaterialCompleteRateDto>> GetMaterialCompleteRatesAsync(ReviewQueryDto query)
    {
        var queryable = _context.ConstructionSites
            .Include(s => s.Area)
            .Include(s => s.PersonInCharge)
            .AsQueryable();

        if (query.AreaId.HasValue)
            queryable = queryable.Where(s => s.AreaId == query.AreaId.Value);

        if (query.PersonInChargeId.HasValue)
            queryable = queryable.Where(s => s.PersonInChargeId == query.PersonInChargeId.Value);

        if (!string.IsNullOrEmpty(query.TagGroup))
            queryable = queryable.Where(s => s.TagGroup == query.TagGroup);

        if (query.StartDate.HasValue)
            queryable = queryable.Where(s => s.CreatedAt >= query.StartDate.Value);

        if (query.EndDate.HasValue)
            queryable = queryable.Where(s => s.CreatedAt <= query.EndDate.Value);

        var sites = await queryable.ToListAsync();
        var requiredMaterials = await _context.AttachmentMaterials
            .Where(m => m.IsRequired)
            .CountAsync();

        var siteIds = sites.Select(s => s.Id).ToList();
        var submissions = await _context.MaterialSubmissions
            .Where(m => siteIds.Contains(m.SiteId))
            .GroupBy(m => m.SiteId)
            .Select(g => new
            {
                SiteId = g.Key,
                SubmittedCount = g.Count(m => m.Status != SubmissionStatus.Pending),
                ApprovedCount = g.Count(m => m.Status == SubmissionStatus.Approved)
            })
            .ToDictionaryAsync(g => g.SiteId);

        var result = new List<MaterialCompleteRateDto>();
        foreach (var site in sites)
        {
            var siteSubmissions = submissions.GetValueOrDefault(site.Id);
            var submittedCount = siteSubmissions?.SubmittedCount ?? 0;
            var approvedCount = siteSubmissions?.ApprovedCount ?? 0;
            var missingCount = requiredMaterials - submittedCount;
            if (missingCount < 0) missingCount = 0;

            result.Add(new MaterialCompleteRateDto
            {
                SiteId = site.Id,
                SiteName = site.SiteName,
                AreaName = site.Area?.Name ?? string.Empty,
                PersonInChargeName = site.PersonInCharge?.Name ?? string.Empty,
                TotalRequiredCount = requiredMaterials,
                SubmittedCount = submittedCount,
                ApprovedCount = approvedCount,
                MissingCount = missingCount,
                CompleteRate = requiredMaterials > 0 ? Math.Round((double)submittedCount / requiredMaterials * 100, 2) : 0,
                ApprovedRate = requiredMaterials > 0 ? Math.Round((double)approvedCount / requiredMaterials * 100, 2) : 0
            });
        }

        return result.OrderByDescending(r => r.MissingCount).ToList();
    }

    public async Task<List<AreaStatisticsDto>> GetAreaStatisticsAsync(ReviewQueryDto query)
    {
        var areas = await _context.Areas.ToListAsync();
        var result = new List<AreaStatisticsDto>();

        foreach (var area in areas)
        {
            var sitesQuery = _context.ConstructionSites.Where(s => s.AreaId == area.Id);

            if (query.StartDate.HasValue)
                sitesQuery = sitesQuery.Where(s => s.CreatedAt >= query.StartDate.Value);

            if (query.EndDate.HasValue)
                sitesQuery = sitesQuery.Where(s => s.CreatedAt <= query.EndDate.Value);

            var siteCount = await sitesQuery.CountAsync();

            var siteIds = await sitesQuery.Select(s => s.Id).ToListAsync();
            var requiredMaterials = await _context.AttachmentMaterials
                .Where(m => m.IsRequired)
                .CountAsync();

            var totalMaterialRelations = siteCount * requiredMaterials;

            var submittedCount = await _context.MaterialSubmissions
                .Where(m => siteIds.Contains(m.SiteId) && m.Status != SubmissionStatus.Pending)
                .CountAsync();

            var missingCount = totalMaterialRelations - submittedCount;
            if (missingCount < 0) missingCount = 0;

            result.Add(new AreaStatisticsDto
            {
                AreaId = area.Id,
                AreaName = area.Name,
                SiteCount = siteCount,
                AvgCompleteRate = totalMaterialRelations > 0 ? Math.Round((double)submittedCount / totalMaterialRelations * 100, 2) : 0,
                MissingMaterialCount = missingCount
            });
        }

        return result.OrderByDescending(r => r.MissingMaterialCount).ToList();
    }

    public async Task<List<PersonStatisticsDto>> GetPersonStatisticsAsync(ReviewQueryDto query)
    {
        var persons = await _context.PersonInCharges.ToListAsync();
        var result = new List<PersonStatisticsDto>();

        foreach (var person in persons)
        {
            var sitesQuery = _context.ConstructionSites.Where(s => s.PersonInChargeId == person.Id);

            if (query.StartDate.HasValue)
                sitesQuery = sitesQuery.Where(s => s.CreatedAt >= query.StartDate.Value);

            if (query.EndDate.HasValue)
                sitesQuery = sitesQuery.Where(s => s.CreatedAt <= query.EndDate.Value);

            var siteCount = await sitesQuery.CountAsync();

            var siteIds = await sitesQuery.Select(s => s.Id).ToListAsync();
            var requiredMaterials = await _context.AttachmentMaterials
                .Where(m => m.IsRequired)
                .CountAsync();

            var totalMaterialRelations = siteCount * requiredMaterials;

            var submittedCount = await _context.MaterialSubmissions
                .Where(m => siteIds.Contains(m.SiteId) && m.Status != SubmissionStatus.Pending)
                .CountAsync();

            var missingCount = totalMaterialRelations - submittedCount;
            if (missingCount < 0) missingCount = 0;

            result.Add(new PersonStatisticsDto
            {
                PersonId = person.Id,
                PersonName = person.Name,
                SiteCount = siteCount,
                AvgCompleteRate = totalMaterialRelations > 0 ? Math.Round((double)submittedCount / totalMaterialRelations * 100, 2) : 0,
                MissingMaterialCount = missingCount
            });
        }

        return result.OrderByDescending(r => r.MissingMaterialCount).ToList();
    }

    public async Task<List<MaterialStatisticsDto>> GetMaterialStatisticsAsync(ReviewQueryDto query)
    {
        var materials = await _context.AttachmentMaterials
            .Where(m => m.IsRequired)
            .ToListAsync();

        var sitesQuery = _context.ConstructionSites.AsQueryable();

        if (query.AreaId.HasValue)
            sitesQuery = sitesQuery.Where(s => s.AreaId == query.AreaId.Value);

        if (query.PersonInChargeId.HasValue)
            sitesQuery = sitesQuery.Where(s => s.PersonInChargeId == query.PersonInChargeId.Value);

        if (query.StartDate.HasValue)
            sitesQuery = sitesQuery.Where(s => s.CreatedAt >= query.StartDate.Value);

        if (query.EndDate.HasValue)
            sitesQuery = sitesQuery.Where(s => s.CreatedAt <= query.EndDate.Value);

        var totalSites = await sitesQuery.CountAsync();
        var siteIds = await sitesQuery.Select(s => s.Id).ToListAsync();

        var result = new List<MaterialStatisticsDto>();

        foreach (var material in materials)
        {
            var submittedCount = await _context.MaterialSubmissions
                .Where(m => m.MaterialId == material.Id && siteIds.Contains(m.SiteId) && m.Status != SubmissionStatus.Pending)
                .CountAsync();

            var approvedCount = await _context.MaterialSubmissions
                .Where(m => m.MaterialId == material.Id && siteIds.Contains(m.SiteId) && m.Status == SubmissionStatus.Approved)
                .CountAsync();

            result.Add(new MaterialStatisticsDto
            {
                MaterialId = material.Id,
                MaterialName = material.Name,
                Category = material.Category.ToString(),
                TotalSites = totalSites,
                SubmittedCount = submittedCount,
                ApprovedCount = approvedCount,
                SubmissionRate = totalSites > 0 ? Math.Round((double)submittedCount / totalSites * 100, 2) : 0,
                ApprovalRate = totalSites > 0 ? Math.Round((double)approvedCount / totalSites * 100, 2) : 0
            });
        }

        return result.OrderBy(r => r.SubmissionRate).ToList();
    }
}
