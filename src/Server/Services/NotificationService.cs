using Microsoft.EntityFrameworkCore;
using SiteSchedule.Data;
using SiteSchedule.Dtos.ActionLog;
using SiteSchedule.Dtos.Common;
using SiteSchedule.Dtos.Notification;
using SiteSchedule.Models;

namespace SiteSchedule.Services;

public class NotificationService : INotificationService
{
    private readonly AppDbContext _context;
    private readonly IActionLogService _actionLogService;

    public NotificationService(AppDbContext context, IActionLogService actionLogService)
    {
        _context = context;
        _actionLogService = actionLogService;
    }

    public async Task<PagedResult<NotificationRecordDto>> GetPagedListAsync(NotificationQueryDto query)
    {
        var queryable = _context.NotificationRecords
            .Include(n => n.Site)
            .Include(n => n.RecipientPerson)
            .AsQueryable();

        if (query.SiteId.HasValue)
            queryable = queryable.Where(x => x.SiteId == query.SiteId.Value);

        if (query.Type.HasValue)
            queryable = queryable.Where(x => x.Type == query.Type.Value);

        if (query.Status.HasValue)
            queryable = queryable.Where(x => x.Status == query.Status.Value);

        if (!string.IsNullOrEmpty(query.RecipientName))
            queryable = queryable.Where(x => x.RecipientName != null && x.RecipientName.Contains(query.RecipientName));

        if (query.CreatedFrom.HasValue)
            queryable = queryable.Where(x => x.CreatedAt >= query.CreatedFrom.Value);

        if (query.CreatedTo.HasValue)
            queryable = queryable.Where(x => x.CreatedAt <= query.CreatedTo.Value);

        var totalCount = await queryable.CountAsync();

        var items = await queryable
            .OrderByDescending(x => x.CreatedAt)
            .Skip((query.PageIndex - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(x => new NotificationRecordDto
            {
                Id = x.Id,
                SiteId = x.SiteId,
                SiteName = x.Site.SiteName,
                Type = x.Type,
                TypeText = x.Type.ToString(),
                Channel = x.Channel,
                ChannelText = x.Channel.ToString(),
                Title = x.Title,
                Content = x.Content,
                RecipientName = x.RecipientName,
                RecipientPhone = x.RecipientPhone,
                RecipientEmail = x.RecipientEmail,
                RecipientPersonId = x.RecipientPersonId,
                Status = x.Status,
                StatusText = x.Status.ToString(),
                RetryCount = x.RetryCount,
                SentAt = x.SentAt,
                ReadAt = x.ReadAt,
                FailureReason = x.FailureReason,
                CreatedBy = x.CreatedBy,
                CreatedAt = x.CreatedAt,
                ExpireAt = x.ExpireAt
            })
            .ToListAsync();

        return new PagedResult<NotificationRecordDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageIndex = query.PageIndex,
            PageSize = query.PageSize,
            TotalPages = (int)Math.Ceiling((double)totalCount / query.PageSize)
        };
    }

    public async Task<NotificationRecordDto?> GetByIdAsync(int id)
    {
        var entity = await _context.NotificationRecords
            .Include(n => n.Site)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (entity == null) return null;

        return new NotificationRecordDto
        {
            Id = entity.Id,
            SiteId = entity.SiteId,
            SiteName = entity.Site.SiteName,
            Type = entity.Type,
            TypeText = entity.Type.ToString(),
            Channel = entity.Channel,
            ChannelText = entity.Channel.ToString(),
            Title = entity.Title,
            Content = entity.Content,
            RecipientName = entity.RecipientName,
            RecipientPhone = entity.RecipientPhone,
            RecipientEmail = entity.RecipientEmail,
            RecipientPersonId = entity.RecipientPersonId,
            Status = entity.Status,
            StatusText = entity.Status.ToString(),
            RetryCount = entity.RetryCount,
            SentAt = entity.SentAt,
            ReadAt = entity.ReadAt,
            FailureReason = entity.FailureReason,
            CreatedBy = entity.CreatedBy,
            CreatedAt = entity.CreatedAt,
            ExpireAt = entity.ExpireAt
        };
    }

    public async Task<NotificationRecordDto> CreateAsync(NotificationCreateDto dto)
    {
        var entity = new NotificationRecord
        {
            SiteId = dto.SiteId,
            Type = dto.Type,
            Channel = dto.Channel,
            Title = dto.Title,
            Content = dto.Content,
            RecipientName = dto.RecipientName,
            RecipientPhone = dto.RecipientPhone,
            RecipientEmail = dto.RecipientEmail,
            RecipientPersonId = dto.RecipientPersonId,
            Status = NotificationStatus.Pending,
            CreatedBy = dto.CreatedBy,
            CreatedAt = DateTime.Now,
            ExpireAt = dto.ExpireAt
        };

        _context.NotificationRecords.Add(entity);
        await _context.SaveChangesAsync();

        return (await GetByIdAsync(entity.Id))!;
    }

    public async Task<bool> MarkAsReadAsync(int id)
    {
        var entity = await _context.NotificationRecords.FindAsync(id);
        if (entity == null) return false;

        entity.Status = NotificationStatus.Read;
        entity.ReadAt = DateTime.Now;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<int> MarkAllAsReadAsync(int? siteId = null)
    {
        var query = _context.NotificationRecords
            .Where(x => x.Status == NotificationStatus.Pending || x.Status == NotificationStatus.Sent);

        if (siteId.HasValue)
            query = query.Where(x => x.SiteId == siteId.Value);

        var records = await query.ToListAsync();

        foreach (var record in records)
        {
            record.Status = NotificationStatus.Read;
            record.ReadAt = DateTime.Now;
        }

        await _context.SaveChangesAsync();
        return records.Count;
    }

    public async Task<int> GetUnreadCountAsync(int? siteId = null)
    {
        var query = _context.NotificationRecords
            .Where(x => x.Status == NotificationStatus.Pending || x.Status == NotificationStatus.Sent);

        if (siteId.HasValue)
            query = query.Where(x => x.SiteId == siteId.Value);

        return await query.CountAsync();
    }

    public async Task<bool> SendNotificationAsync(NotificationCreateDto dto)
    {
        var notification = await CreateAsync(dto);

        try
        {
            var entity = await _context.NotificationRecords.FindAsync(notification.Id);
            if (entity != null)
            {
                entity.Status = NotificationStatus.Sent;
                entity.SentAt = DateTime.Now;
                await _context.SaveChangesAsync();
            }

            return true;
        }
        catch (Exception ex)
        {
            var entity = await _context.NotificationRecords.FindAsync(notification.Id);
            if (entity != null)
            {
                entity.Status = NotificationStatus.Failed;
                entity.FailureReason = ex.Message;
                await _context.SaveChangesAsync();
            }

            return false;
        }
    }

    public async Task CheckAndSendMaterialMissingNotificationsAsync()
    {
        var requiredMaterials = await _context.AttachmentMaterials
            .Where(m => m.IsRequired)
            .ToListAsync();

        var sites = await _context.ConstructionSites
            .Include(s => s.PersonInCharge)
            .Where(s => s.Status != SiteStatus.Completed && s.Status != SiteStatus.Closed)
            .ToListAsync();

        foreach (var site in sites)
        {
            var submittedMaterialIds = await _context.MaterialSubmissions
                .Where(m => m.SiteId == site.Id && m.Status != SubmissionStatus.Pending)
                .Select(m => m.MaterialId)
                .ToListAsync();

            var missingMaterials = requiredMaterials
                .Where(m => !submittedMaterialIds.Contains(m.Id))
                .ToList();

            if (missingMaterials.Any())
            {
                var existingNotification = await _context.NotificationRecords
                    .Where(n => n.SiteId == site.Id
                        && n.Type == NotificationType.MaterialMissing
                        && n.CreatedAt >= DateTime.Today)
                    .FirstOrDefaultAsync();

                if (existingNotification == null)
                {
                    var notification = new NotificationCreateDto
                    {
                        SiteId = site.Id,
                        Type = NotificationType.MaterialMissing,
                        Channel = NotificationChannel.System,
                        Title = $"工地【{site.SiteName}】资料缺失提醒",
                        Content = $"该工地缺失{missingMaterials.Count}项必需材料：{string.Join("、", missingMaterials.Select(m => m.Name))}",
                        RecipientName = site.PersonInCharge.Name,
                        RecipientPhone = site.PersonInCharge.Phone,
                        RecipientPersonId = site.PersonInChargeId,
                        CreatedBy = "系统",
                        ExpireAt = DateTime.Now.AddDays(7)
                    };

                    await SendNotificationAsync(notification);
                }
            }
        }
    }
}
