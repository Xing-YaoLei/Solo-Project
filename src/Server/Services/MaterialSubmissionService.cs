using Microsoft.EntityFrameworkCore;
using SiteSchedule.Data;
using SiteSchedule.Dtos.ActionLog;
using SiteSchedule.Dtos.Common;
using SiteSchedule.Dtos.MaterialSubmission;
using SiteSchedule.Models;

namespace SiteSchedule.Services;

public class MaterialSubmissionService : IMaterialSubmissionService
{
    private readonly AppDbContext _context;
    private readonly IActionLogService _actionLogService;

    public MaterialSubmissionService(AppDbContext context, IActionLogService actionLogService)
    {
        _context = context;
        _actionLogService = actionLogService;
    }

    public async Task<PagedResult<MaterialSubmissionDto>> GetPagedListAsync(MaterialSubmissionQueryDto query)
    {
        var queryable = _context.MaterialSubmissions
            .Include(m => m.Site)
            .Include(m => m.Material)
            .AsQueryable();

        if (query.SiteId.HasValue)
            queryable = queryable.Where(x => x.SiteId == query.SiteId.Value);

        if (query.MaterialId.HasValue)
            queryable = queryable.Where(x => x.MaterialId == query.MaterialId.Value);

        if (query.Status.HasValue)
            queryable = queryable.Where(x => x.Status == query.Status.Value);

        if (query.Category.HasValue)
            queryable = queryable.Where(x => x.Material.Category == query.Category.Value);

        if (query.SubmittedFrom.HasValue)
            queryable = queryable.Where(x => x.SubmittedAt >= query.SubmittedFrom.Value);

        if (query.SubmittedTo.HasValue)
            queryable = queryable.Where(x => x.SubmittedAt <= query.SubmittedTo.Value);

        var totalCount = await queryable.CountAsync();

        var items = await queryable
            .OrderByDescending(x => x.CreatedAt)
            .Skip((query.PageIndex - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(x => new MaterialSubmissionDto
            {
                Id = x.Id,
                SiteId = x.SiteId,
                SiteName = x.Site.SiteName,
                ConfirmationId = x.ConfirmationId,
                MaterialId = x.MaterialId,
                MaterialName = x.Material.Name,
                MaterialCategory = x.Material.Category,
                MaterialCategoryText = x.Material.Category.ToString(),
                IsRequired = x.Material.IsRequired,
                Status = x.Status,
                StatusText = x.Status.ToString(),
                FilePath = x.FilePath,
                FileName = x.FileName,
                FileSize = x.FileSize,
                Remark = x.Remark,
                SubmittedAt = x.SubmittedAt,
                SubmittedBy = x.SubmittedBy,
                ReviewedAt = x.ReviewedAt,
                ReviewedBy = x.ReviewedBy,
                ReviewComment = x.ReviewComment,
                RetryCount = x.RetryCount,
                CreatedAt = x.CreatedAt,
                UpdatedAt = x.UpdatedAt
            })
            .ToListAsync();

        return new PagedResult<MaterialSubmissionDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageIndex = query.PageIndex,
            PageSize = query.PageSize,
            TotalPages = (int)Math.Ceiling((double)totalCount / query.PageSize)
        };
    }

    public async Task<MaterialSubmissionDto?> GetByIdAsync(int id)
    {
        var entity = await _context.MaterialSubmissions
            .Include(m => m.Site)
            .Include(m => m.Material)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (entity == null) return null;

        return new MaterialSubmissionDto
        {
            Id = entity.Id,
            SiteId = entity.SiteId,
            SiteName = entity.Site.SiteName,
            ConfirmationId = entity.ConfirmationId,
            MaterialId = entity.MaterialId,
            MaterialName = entity.Material.Name,
            MaterialCategory = entity.Material.Category,
            MaterialCategoryText = entity.Material.Category.ToString(),
            IsRequired = entity.Material.IsRequired,
            Status = entity.Status,
            StatusText = entity.Status.ToString(),
            FilePath = entity.FilePath,
            FileName = entity.FileName,
            FileSize = entity.FileSize,
            Remark = entity.Remark,
            SubmittedAt = entity.SubmittedAt,
            SubmittedBy = entity.SubmittedBy,
            ReviewedAt = entity.ReviewedAt,
            ReviewedBy = entity.ReviewedBy,
            ReviewComment = entity.ReviewComment,
            RetryCount = entity.RetryCount,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt
        };
    }

    public async Task<List<MaterialSubmissionDto>> GetBySiteIdAsync(int siteId)
    {
        return await _context.MaterialSubmissions
            .Include(m => m.Material)
            .Where(x => x.SiteId == siteId)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new MaterialSubmissionDto
            {
                Id = x.Id,
                SiteId = x.SiteId,
                MaterialId = x.MaterialId,
                MaterialName = x.Material.Name,
                MaterialCategory = x.Material.Category,
                MaterialCategoryText = x.Material.Category.ToString(),
                IsRequired = x.Material.IsRequired,
                Status = x.Status,
                StatusText = x.Status.ToString(),
                FilePath = x.FilePath,
                FileName = x.FileName,
                FileSize = x.FileSize,
                Remark = x.Remark,
                SubmittedAt = x.SubmittedAt,
                SubmittedBy = x.SubmittedBy,
                ReviewedAt = x.ReviewedAt,
                ReviewedBy = x.ReviewedBy,
                ReviewComment = x.ReviewComment,
                RetryCount = x.RetryCount,
                CreatedAt = x.CreatedAt,
                UpdatedAt = x.UpdatedAt
            })
            .ToListAsync();
    }

    public async Task<MaterialSubmissionDto> CreateAsync(MaterialSubmissionCreateDto dto)
    {
        var entity = new MaterialSubmission
        {
            SiteId = dto.SiteId,
            ConfirmationId = dto.ConfirmationId,
            MaterialId = dto.MaterialId,
            Status = SubmissionStatus.Submitted,
            FilePath = dto.FilePath,
            FileName = dto.FileName,
            FileSize = dto.FileSize,
            Remark = dto.Remark,
            SubmittedAt = DateTime.Now,
            SubmittedBy = dto.SubmittedBy,
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };

        _context.MaterialSubmissions.Add(entity);
        await _context.SaveChangesAsync();

        await _actionLogService.CreateAsync(new ActionLogCreateDto
        {
            SiteId = entity.SiteId,
            TargetId = entity.Id,
            TargetType = ActionTargetType.Material,
            ActionType = ActionType.Submit,
            ActionTitle = "提交材料",
            ActionDescription = $"提交材料：{entity.FileName}",
            OperatorName = dto.SubmittedBy ?? "系统"
        });

        return (await GetByIdAsync(entity.Id))!;
    }

    public async Task<MaterialSubmissionDto> UpdateAsync(MaterialSubmissionUpdateDto dto)
    {
        var entity = await _context.MaterialSubmissions.FindAsync(dto.Id);
        if (entity == null)
            throw new KeyNotFoundException($"材料提交不存在，ID: {dto.Id}");

        entity.Status = dto.Status;
        entity.FilePath = dto.FilePath;
        entity.FileName = dto.FileName;
        entity.FileSize = dto.FileSize;
        entity.Remark = dto.Remark;
        entity.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync();

        return (await GetByIdAsync(entity.Id))!;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var entity = await _context.MaterialSubmissions.FindAsync(id);
        if (entity == null) return false;

        _context.MaterialSubmissions.Remove(entity);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<MaterialSubmissionDto> ReviewAsync(MaterialSubmissionReviewDto dto)
    {
        var entity = await _context.MaterialSubmissions.FindAsync(dto.Id);
        if (entity == null)
            throw new KeyNotFoundException($"材料提交不存在，ID: {dto.Id}");

        var oldStatus = entity.Status;
        entity.Status = dto.Status;
        entity.ReviewedAt = DateTime.Now;
        entity.ReviewedBy = dto.ReviewedBy;
        entity.ReviewComment = dto.ReviewComment;
        entity.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync();

        await _actionLogService.CreateAsync(new ActionLogCreateDto
        {
            SiteId = entity.SiteId,
            TargetId = entity.Id,
            TargetType = ActionTargetType.Material,
            ActionType = dto.Status == SubmissionStatus.Approved ? ActionType.Approve : ActionType.Reject,
            ActionTitle = dto.Status == SubmissionStatus.Approved ? "审核通过" : "审核拒绝",
            OldValue = oldStatus.ToString(),
            NewValue = dto.Status.ToString(),
            Remark = dto.ReviewComment,
            OperatorName = dto.ReviewedBy ?? "系统"
        });

        return (await GetByIdAsync(entity.Id))!;
    }

    public async Task<MaterialSubmissionDto> RetryAsync(MaterialSubmissionRetryDto dto)
    {
        var entity = await _context.MaterialSubmissions.FindAsync(dto.Id);
        if (entity == null)
            throw new KeyNotFoundException($"材料提交不存在，ID: {dto.Id}");

        entity.Status = SubmissionStatus.Submitted;
        entity.FilePath = dto.FilePath ?? entity.FilePath;
        entity.FileName = dto.FileName ?? entity.FileName;
        entity.FileSize = dto.FileSize ?? entity.FileSize;
        entity.Remark = dto.Remark;
        entity.RetryCount += 1;
        entity.SubmittedAt = DateTime.Now;
        entity.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync();

        await _actionLogService.CreateAsync(new ActionLogCreateDto
        {
            SiteId = entity.SiteId,
            TargetId = entity.Id,
            TargetType = ActionTargetType.Material,
            ActionType = ActionType.Retry,
            ActionTitle = "重试提交",
            ActionDescription = $"第{entity.RetryCount}次重试提交材料",
            Remark = dto.Remark,
            OperatorName = dto.OperatorName ?? "系统"
        });

        return (await GetByIdAsync(entity.Id))!;
    }

    public async Task<MaterialSubmissionDto> CloseAsync(MaterialSubmissionCloseDto dto)
    {
        var entity = await _context.MaterialSubmissions.FindAsync(dto.Id);
        if (entity == null)
            throw new KeyNotFoundException($"材料提交不存在，ID: {dto.Id}");

        var oldStatus = entity.Status;
        entity.Status = SubmissionStatus.Approved;
        entity.Remark = dto.Remark;
        entity.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync();

        await _actionLogService.CreateAsync(new ActionLogCreateDto
        {
            SiteId = entity.SiteId,
            TargetId = entity.Id,
            TargetType = ActionTargetType.Material,
            ActionType = ActionType.Close,
            ActionTitle = "关闭材料",
            OldValue = oldStatus.ToString(),
            NewValue = "Closed",
            Remark = dto.Remark,
            OperatorName = dto.OperatorName ?? "系统"
        });

        return (await GetByIdAsync(entity.Id))!;
    }

    public async Task<MaterialSubmissionDto> SupplementAsync(MaterialSubmissionCreateDto dto)
    {
        var entity = new MaterialSubmission
        {
            SiteId = dto.SiteId,
            ConfirmationId = dto.ConfirmationId,
            MaterialId = dto.MaterialId,
            Status = SubmissionStatus.Submitted,
            FilePath = dto.FilePath,
            FileName = dto.FileName,
            FileSize = dto.FileSize,
            Remark = dto.Remark,
            SubmittedAt = DateTime.Now,
            SubmittedBy = dto.SubmittedBy,
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };

        _context.MaterialSubmissions.Add(entity);
        await _context.SaveChangesAsync();

        await _actionLogService.CreateAsync(new ActionLogCreateDto
        {
            SiteId = entity.SiteId,
            TargetId = entity.Id,
            TargetType = ActionTargetType.Material,
            ActionType = ActionType.Supplement,
            ActionTitle = "补录材料",
            ActionDescription = $"补录材料：{entity.FileName}",
            OperatorName = dto.SubmittedBy ?? "系统"
        });

        return (await GetByIdAsync(entity.Id))!;
    }
}
