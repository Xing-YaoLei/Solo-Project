using Microsoft.EntityFrameworkCore;
using SiteSchedule.Data;
using SiteSchedule.Dtos.Common;
using SiteSchedule.Dtos.ConstructionSite;
using SiteSchedule.Models;

namespace SiteSchedule.Services;

public class ConstructionSiteService : IConstructionSiteService
{
    private readonly AppDbContext _context;
    private readonly IActionLogService _actionLogService;

    public ConstructionSiteService(AppDbContext context, IActionLogService actionLogService)
    {
        _context = context;
        _actionLogService = actionLogService;
    }

    public async Task<PagedResult<ConstructionSiteDto>> GetPagedListAsync(ConstructionSiteQueryDto query)
    {
        var queryable = _context.ConstructionSites
            .Include(s => s.Customer)
            .Include(s => s.Area)
            .Include(s => s.PersonInCharge)
            .AsQueryable();

        if (!string.IsNullOrEmpty(query.SiteName))
            queryable = queryable.Where(x => x.SiteName.Contains(query.SiteName));

        if (query.Status.HasValue)
            queryable = queryable.Where(x => x.Status == query.Status.Value);

        if (query.AreaId.HasValue)
            queryable = queryable.Where(x => x.AreaId == query.AreaId.Value);

        if (query.PersonInChargeId.HasValue)
            queryable = queryable.Where(x => x.PersonInChargeId == query.PersonInChargeId.Value);

        if (query.StartDateFrom.HasValue)
            queryable = queryable.Where(x => x.PlannedStartDate >= query.StartDateFrom.Value);

        if (query.StartDateTo.HasValue)
            queryable = queryable.Where(x => x.PlannedStartDate <= query.StartDateTo.Value);

        if (query.EndDateFrom.HasValue)
            queryable = queryable.Where(x => x.PlannedEndDate >= query.EndDateFrom.Value);

        if (query.EndDateTo.HasValue)
            queryable = queryable.Where(x => x.PlannedEndDate <= query.EndDateTo.Value);

        if (!string.IsNullOrEmpty(query.TagGroup))
            queryable = queryable.Where(x => x.TagGroup == query.TagGroup);

        if (!string.IsNullOrEmpty(query.CustomerName))
            queryable = queryable.Where(x => x.Customer.CustomerName.Contains(query.CustomerName));

        var totalCount = await queryable.CountAsync();

        var sites = await queryable
            .OrderByDescending(x => x.CreatedAt)
            .Skip((query.PageIndex - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync();

        var siteIds = sites.Select(s => s.Id).ToList();
        var requiredMaterials = await _context.AttachmentMaterials
            .Where(m => m.IsRequired)
            .CountAsync();

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

        var items = sites.Select(site =>
        {
            var siteSubmissions = submissions.GetValueOrDefault(site.Id);
            var submittedCount = siteSubmissions?.SubmittedCount ?? 0;
            var completeRate = requiredMaterials > 0 ? (double)submittedCount / requiredMaterials * 100 : 0;

            return new ConstructionSiteDto
            {
                Id = site.Id,
                SiteName = site.SiteName,
                Address = site.Address,
                CustomerId = site.CustomerId,
                CustomerName = site.Customer.CustomerName,
                CustomerPhone = site.Customer.Phone,
                AreaId = site.AreaId,
                AreaName = site.Area.Name,
                PersonInChargeId = site.PersonInChargeId,
                PersonInChargeName = site.PersonInCharge.Name,
                PersonInChargePhone = site.PersonInCharge.Phone,
                Status = site.Status,
                StatusText = site.Status.ToString(),
                TagGroup = site.TagGroup,
                PlannedStartDate = site.PlannedStartDate,
                PlannedEndDate = site.PlannedEndDate,
                ActualStartDate = site.ActualStartDate,
                ActualEndDate = site.ActualEndDate,
                ConfirmationDeadline = site.ConfirmationDeadline,
                Budget = site.Budget,
                Remark = site.Remark,
                MaterialCompleteRate = Math.Round(completeRate, 2),
                TotalMaterialCount = requiredMaterials,
                SubmittedMaterialCount = submittedCount,
                CreatedAt = site.CreatedAt,
                UpdatedAt = site.UpdatedAt
            };
        }).ToList();

        return new PagedResult<ConstructionSiteDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageIndex = query.PageIndex,
            PageSize = query.PageSize,
            TotalPages = (int)Math.Ceiling((double)totalCount / query.PageSize)
        };
    }

    public async Task<ConstructionSiteDto?> GetByIdAsync(int id)
    {
        var site = await _context.ConstructionSites
            .Include(s => s.Customer)
            .Include(s => s.Area)
            .Include(s => s.PersonInCharge)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (site == null) return null;

        var (completeRate, totalCount, submittedCount) = await GetMaterialCompleteRateDetailAsync(id);

        return new ConstructionSiteDto
        {
            Id = site.Id,
            SiteName = site.SiteName,
            Address = site.Address,
            CustomerId = site.CustomerId,
            CustomerName = site.Customer.CustomerName,
            CustomerPhone = site.Customer.Phone,
            AreaId = site.AreaId,
            AreaName = site.Area.Name,
            PersonInChargeId = site.PersonInChargeId,
            PersonInChargeName = site.PersonInCharge.Name,
            PersonInChargePhone = site.PersonInCharge.Phone,
            Status = site.Status,
            StatusText = site.Status.ToString(),
            TagGroup = site.TagGroup,
            PlannedStartDate = site.PlannedStartDate,
            PlannedEndDate = site.PlannedEndDate,
            ActualStartDate = site.ActualStartDate,
            ActualEndDate = site.ActualEndDate,
            ConfirmationDeadline = site.ConfirmationDeadline,
            Budget = site.Budget,
            Remark = site.Remark,
            MaterialCompleteRate = Math.Round(completeRate, 2),
            TotalMaterialCount = totalCount,
            SubmittedMaterialCount = submittedCount,
            CreatedAt = site.CreatedAt,
            UpdatedAt = site.UpdatedAt
        };
    }

    public async Task<ConstructionSiteDto> CreateAsync(ConstructionSiteCreateDto dto)
    {
        var entity = new ConstructionSite
        {
            SiteName = dto.SiteName,
            Address = dto.Address,
            CustomerId = dto.CustomerId,
            AreaId = dto.AreaId,
            PersonInChargeId = dto.PersonInChargeId,
            Status = dto.Status,
            TagGroup = dto.TagGroup,
            PlannedStartDate = dto.PlannedStartDate,
            PlannedEndDate = dto.PlannedEndDate,
            ConfirmationDeadline = dto.ConfirmationDeadline,
            Budget = dto.Budget,
            Remark = dto.Remark,
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };

        _context.ConstructionSites.Add(entity);
        await _context.SaveChangesAsync();

        await _actionLogService.CreateAsync(new Dtos.ActionLog.ActionLogCreateDto
        {
            SiteId = entity.Id,
            TargetId = entity.Id,
            TargetType = ActionTargetType.Site,
            ActionType = ActionType.Submit,
            ActionTitle = "创建工地",
            ActionDescription = $"创建工地：{dto.SiteName}",
            OperatorName = "系统"
        });

        return (await GetByIdAsync(entity.Id))!;
    }

    public async Task<ConstructionSiteDto> UpdateAsync(ConstructionSiteUpdateDto dto)
    {
        var entity = await _context.ConstructionSites.FindAsync(dto.Id);
        if (entity == null)
            throw new KeyNotFoundException($"工地不存在，ID: {dto.Id}");

        var oldStatus = entity.Status;

        entity.SiteName = dto.SiteName;
        entity.Address = dto.Address;
        entity.CustomerId = dto.CustomerId;
        entity.AreaId = dto.AreaId;
        entity.PersonInChargeId = dto.PersonInChargeId;
        entity.Status = dto.Status;
        entity.TagGroup = dto.TagGroup;
        entity.PlannedStartDate = dto.PlannedStartDate;
        entity.PlannedEndDate = dto.PlannedEndDate;
        entity.ActualStartDate = dto.ActualStartDate;
        entity.ActualEndDate = dto.ActualEndDate;
        entity.ConfirmationDeadline = dto.ConfirmationDeadline;
        entity.Budget = dto.Budget;
        entity.Remark = dto.Remark;
        entity.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync();

        if (oldStatus != dto.Status)
        {
            await _actionLogService.CreateAsync(new Dtos.ActionLog.ActionLogCreateDto
            {
                SiteId = entity.Id,
                TargetId = entity.Id,
                TargetType = ActionTargetType.Site,
                ActionType = ActionType.Other,
                ActionTitle = "状态变更",
                OldValue = oldStatus.ToString(),
                NewValue = dto.Status.ToString(),
                OperatorName = "系统"
            });
        }

        return (await GetByIdAsync(entity.Id))!;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var entity = await _context.ConstructionSites.FindAsync(id);
        if (entity == null) return false;

        _context.ConstructionSites.Remove(entity);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateStatusAsync(ConstructionSiteStatusUpdateDto dto, string? operatorName = null)
    {
        var entity = await _context.ConstructionSites.FindAsync(dto.Id);
        if (entity == null) return false;

        var oldStatus = entity.Status;
        entity.Status = dto.Status;
        entity.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync();

        await _actionLogService.CreateAsync(new Dtos.ActionLog.ActionLogCreateDto
        {
            SiteId = entity.Id,
            TargetId = entity.Id,
            TargetType = ActionTargetType.Site,
            ActionType = ActionType.Other,
            ActionTitle = "状态变更",
            OldValue = oldStatus.ToString(),
            NewValue = dto.Status.ToString(),
            Remark = dto.Remark,
            OperatorName = operatorName ?? "系统"
        });

        return true;
    }

    public async Task<double> GetMaterialCompleteRateAsync(int siteId)
    {
        var (rate, _, _) = await GetMaterialCompleteRateDetailAsync(siteId);
        return rate;
    }

    private async Task<(double rate, int totalCount, int submittedCount)> GetMaterialCompleteRateDetailAsync(int siteId)
    {
        var requiredMaterials = await _context.AttachmentMaterials
            .Where(m => m.IsRequired)
            .CountAsync();

        var submittedCount = await _context.MaterialSubmissions
            .Where(m => m.SiteId == siteId && m.Status != SubmissionStatus.Pending)
            .CountAsync();

        var rate = requiredMaterials > 0 ? (double)submittedCount / requiredMaterials * 100 : 0;
        return (rate, requiredMaterials, submittedCount);
    }
}
