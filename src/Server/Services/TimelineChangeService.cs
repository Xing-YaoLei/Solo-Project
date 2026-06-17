using Microsoft.EntityFrameworkCore;
using SiteSchedule.Data;
using SiteSchedule.Dtos.Common;
using SiteSchedule.Dtos.TimelineChange;
using SiteSchedule.Models;

namespace SiteSchedule.Services;

public class TimelineChangeService : ITimelineChangeService
{
    private readonly AppDbContext _context;

    public TimelineChangeService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<TimelineChangeDto>> GetPagedListAsync(TimelineChangeQueryDto query)
    {
        var queryable = _context.TimelineChanges
            .Include(t => t.Site)
            .AsQueryable();

        if (query.SiteId.HasValue)
            queryable = queryable.Where(x => x.SiteId == query.SiteId.Value);

        if (query.ChangeType.HasValue)
            queryable = queryable.Where(x => x.ChangeType == query.ChangeType.Value);

        if (query.ChangeTimeFrom.HasValue)
            queryable = queryable.Where(x => x.ChangeTime >= query.ChangeTimeFrom.Value);

        if (query.ChangeTimeTo.HasValue)
            queryable = queryable.Where(x => x.ChangeTime <= query.ChangeTimeTo.Value);

        if (!string.IsNullOrEmpty(query.OperatorName))
            queryable = queryable.Where(x => x.OperatorName != null && x.OperatorName.Contains(query.OperatorName));

        var totalCount = await queryable.CountAsync();

        var items = await queryable
            .OrderByDescending(x => x.ChangeTime)
            .Skip((query.PageIndex - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(x => new TimelineChangeDto
            {
                Id = x.Id,
                SiteId = x.SiteId,
                SiteName = x.Site.SiteName,
                ChangeType = x.ChangeType,
                ChangeTypeText = x.ChangeType.ToString(),
                ChangeTitle = x.ChangeTitle,
                ChangeDescription = x.ChangeDescription,
                OldValue = x.OldValue,
                NewValue = x.NewValue,
                OldDate = x.OldDate,
                NewDate = x.NewDate,
                OperatorName = x.OperatorName,
                OperatorRole = x.OperatorRole,
                ChangeTime = x.ChangeTime,
                Remark = x.Remark
            })
            .ToListAsync();

        return new PagedResult<TimelineChangeDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageIndex = query.PageIndex,
            PageSize = query.PageSize,
            TotalPages = (int)Math.Ceiling((double)totalCount / query.PageSize)
        };
    }

    public async Task<List<TimelineChangeDto>> GetBySiteIdAsync(int siteId)
    {
        return await _context.TimelineChanges
            .Where(x => x.SiteId == siteId)
            .OrderByDescending(x => x.ChangeTime)
            .Select(x => new TimelineChangeDto
            {
                Id = x.Id,
                SiteId = x.SiteId,
                ChangeType = x.ChangeType,
                ChangeTypeText = x.ChangeType.ToString(),
                ChangeTitle = x.ChangeTitle,
                ChangeDescription = x.ChangeDescription,
                OldValue = x.OldValue,
                NewValue = x.NewValue,
                OldDate = x.OldDate,
                NewDate = x.NewDate,
                OperatorName = x.OperatorName,
                OperatorRole = x.OperatorRole,
                ChangeTime = x.ChangeTime,
                Remark = x.Remark
            })
            .ToListAsync();
    }

    public async Task<TimelineChangeDto> CreateAsync(TimelineChangeCreateDto dto)
    {
        var entity = new TimelineChange
        {
            SiteId = dto.SiteId,
            ChangeType = dto.ChangeType,
            ChangeTitle = dto.ChangeTitle,
            ChangeDescription = dto.ChangeDescription,
            OldValue = dto.OldValue,
            NewValue = dto.NewValue,
            OldDate = dto.OldDate,
            NewDate = dto.NewDate,
            OperatorName = dto.OperatorName,
            OperatorRole = dto.OperatorRole,
            ChangeTime = DateTime.Now,
            Remark = dto.Remark
        };

        _context.TimelineChanges.Add(entity);
        await _context.SaveChangesAsync();

        return new TimelineChangeDto
        {
            Id = entity.Id,
            SiteId = entity.SiteId,
            ChangeType = entity.ChangeType,
            ChangeTypeText = entity.ChangeType.ToString(),
            ChangeTitle = entity.ChangeTitle,
            ChangeDescription = entity.ChangeDescription,
            OldValue = entity.OldValue,
            NewValue = entity.NewValue,
            OldDate = entity.OldDate,
            NewDate = entity.NewDate,
            OperatorName = entity.OperatorName,
            OperatorRole = entity.OperatorRole,
            ChangeTime = entity.ChangeTime,
            Remark = entity.Remark
        };
    }
}
