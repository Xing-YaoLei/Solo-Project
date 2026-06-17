using Microsoft.EntityFrameworkCore;
using SiteSchedule.Data;
using SiteSchedule.Dtos.ActionLog;
using SiteSchedule.Dtos.Common;
using SiteSchedule.Models;

namespace SiteSchedule.Services;

public class ActionLogService : IActionLogService
{
    private readonly AppDbContext _context;

    public ActionLogService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<ActionLogDto>> GetPagedListAsync(ActionLogQueryDto query)
    {
        var queryable = _context.ActionLogs
            .Include(a => a.Site)
            .AsQueryable();

        if (query.SiteId.HasValue)
            queryable = queryable.Where(x => x.SiteId == query.SiteId.Value);

        if (query.ActionType.HasValue)
            queryable = queryable.Where(x => x.ActionType == query.ActionType.Value);

        if (query.TargetType.HasValue)
            queryable = queryable.Where(x => x.TargetType == query.TargetType.Value);

        if (query.ActionTimeFrom.HasValue)
            queryable = queryable.Where(x => x.ActionTime >= query.ActionTimeFrom.Value);

        if (query.ActionTimeTo.HasValue)
            queryable = queryable.Where(x => x.ActionTime <= query.ActionTimeTo.Value);

        if (!string.IsNullOrEmpty(query.OperatorName))
            queryable = queryable.Where(x => x.OperatorName != null && x.OperatorName.Contains(query.OperatorName));

        var totalCount = await queryable.CountAsync();

        var items = await queryable
            .OrderByDescending(x => x.ActionTime)
            .Skip((query.PageIndex - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(x => new ActionLogDto
            {
                Id = x.Id,
                SiteId = x.SiteId,
                SiteName = x.Site.SiteName,
                TargetId = x.TargetId,
                TargetType = x.TargetType,
                TargetTypeText = x.TargetType.ToString(),
                ActionType = x.ActionType,
                ActionTypeText = x.ActionType.ToString(),
                ActionTitle = x.ActionTitle,
                ActionDescription = x.ActionDescription,
                OldValue = x.OldValue,
                NewValue = x.NewValue,
                OperatorName = x.OperatorName,
                OperatorRole = x.OperatorRole,
                ActionTime = x.ActionTime,
                Remark = x.Remark,
                IpAddress = x.IpAddress
            })
            .ToListAsync();

        return new PagedResult<ActionLogDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageIndex = query.PageIndex,
            PageSize = query.PageSize,
            TotalPages = (int)Math.Ceiling((double)totalCount / query.PageSize)
        };
    }

    public async Task<List<ActionLogDto>> GetBySiteIdAsync(int siteId)
    {
        return await _context.ActionLogs
            .Where(x => x.SiteId == siteId)
            .OrderByDescending(x => x.ActionTime)
            .Select(x => new ActionLogDto
            {
                Id = x.Id,
                SiteId = x.SiteId,
                TargetId = x.TargetId,
                TargetType = x.TargetType,
                TargetTypeText = x.TargetType.ToString(),
                ActionType = x.ActionType,
                ActionTypeText = x.ActionType.ToString(),
                ActionTitle = x.ActionTitle,
                ActionDescription = x.ActionDescription,
                OldValue = x.OldValue,
                NewValue = x.NewValue,
                OperatorName = x.OperatorName,
                OperatorRole = x.OperatorRole,
                ActionTime = x.ActionTime,
                Remark = x.Remark
            })
            .ToListAsync();
    }

    public async Task<ActionLogDto> CreateAsync(ActionLogCreateDto dto)
    {
        var entity = new ActionLog
        {
            SiteId = dto.SiteId,
            TargetId = dto.TargetId,
            TargetType = dto.TargetType,
            ActionType = dto.ActionType,
            ActionTitle = dto.ActionTitle,
            ActionDescription = dto.ActionDescription,
            OldValue = dto.OldValue,
            NewValue = dto.NewValue,
            OperatorName = dto.OperatorName,
            OperatorRole = dto.OperatorRole,
            ActionTime = DateTime.Now,
            Remark = dto.Remark,
            IpAddress = dto.IpAddress
        };

        _context.ActionLogs.Add(entity);
        await _context.SaveChangesAsync();

        return new ActionLogDto
        {
            Id = entity.Id,
            SiteId = entity.SiteId,
            TargetId = entity.TargetId,
            TargetType = entity.TargetType,
            TargetTypeText = entity.TargetType.ToString(),
            ActionType = entity.ActionType,
            ActionTypeText = entity.ActionType.ToString(),
            ActionTitle = entity.ActionTitle,
            ActionDescription = entity.ActionDescription,
            OldValue = entity.OldValue,
            NewValue = entity.NewValue,
            OperatorName = entity.OperatorName,
            OperatorRole = entity.OperatorRole,
            ActionTime = entity.ActionTime,
            Remark = entity.Remark,
            IpAddress = entity.IpAddress
        };
    }
}
