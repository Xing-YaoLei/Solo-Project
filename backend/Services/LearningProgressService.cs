using Microsoft.EntityFrameworkCore;
using CertSchedulePlatform.Data;
using CertSchedulePlatform.DTOs;
using CertSchedulePlatform.Entities;

namespace CertSchedulePlatform.Services;

public class LearningProgressService : ILearningProgressService
{
    private readonly AppDbContext _context;

    public LearningProgressService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<LearningProgressDto>> GetListAsync(int? userId, int? certificateId,
        int? courseId, ProgressStatus? status, int pageIndex, int pageSize)
    {
        var query = _context.LearningProgresses
            .Include(lp => lp.User)
            .Include(lp => lp.Certificate)
            .Include(lp => lp.Course)
            .AsQueryable();

        if (userId.HasValue)
            query = query.Where(lp => lp.UserId == userId.Value);

        if (certificateId.HasValue)
            query = query.Where(lp => lp.CertificateId == certificateId.Value);

        if (courseId.HasValue)
            query = query.Where(lp => lp.CourseId == courseId.Value);

        if (status.HasValue)
            query = query.Where(lp => lp.Status == status.Value);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(lp => lp.UpdatedAt ?? lp.CreatedAt)
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .Select(lp => new LearningProgressDto
            {
                Id = lp.Id,
                UserId = lp.UserId,
                UserName = lp.User != null ? lp.User.FullName ?? lp.User.Username : null,
                CertificateId = lp.CertificateId,
                CertificateName = lp.Certificate != null ? lp.Certificate.Name : null,
                CourseId = lp.CourseId,
                CourseName = lp.Course != null ? lp.Course.Name : null,
                CompletionRate = lp.CompletionRate,
                TargetRate = lp.TargetRate,
                StartDate = lp.StartDate,
                TargetDate = lp.TargetDate,
                Status = lp.Status,
                StatusText = GetStatusText(lp.Status),
                Note = lp.Note,
                CreatedAt = lp.CreatedAt,
                UpdatedAt = lp.UpdatedAt
            })
            .ToListAsync();

        return new PagedResult<LearningProgressDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageIndex = pageIndex,
            PageSize = pageSize
        };
    }

    public async Task<LearningProgressDto?> GetByIdAsync(int id)
    {
        var progress = await _context.LearningProgresses
            .Include(lp => lp.User)
            .Include(lp => lp.Certificate)
            .Include(lp => lp.Course)
            .FirstOrDefaultAsync(lp => lp.Id == id);

        if (progress == null) return null;

        return new LearningProgressDto
        {
            Id = progress.Id,
            UserId = progress.UserId,
            UserName = progress.User != null ? progress.User.FullName ?? progress.User.Username : null,
            CertificateId = progress.CertificateId,
            CertificateName = progress.Certificate != null ? progress.Certificate.Name : null,
            CourseId = progress.CourseId,
            CourseName = progress.Course != null ? progress.Course.Name : null,
            CompletionRate = progress.CompletionRate,
            TargetRate = progress.TargetRate,
            StartDate = progress.StartDate,
            TargetDate = progress.TargetDate,
            Status = progress.Status,
            StatusText = GetStatusText(progress.Status),
            Note = progress.Note,
            CreatedAt = progress.CreatedAt,
            UpdatedAt = progress.UpdatedAt
        };
    }

    public async Task<LearningProgressDetailDto> GetDetailAsync(int id)
    {
        var progress = await _context.LearningProgresses
            .Include(lp => lp.User)
            .Include(lp => lp.Certificate)
            .Include(lp => lp.Course)
            .FirstOrDefaultAsync(lp => lp.Id == id);

        var result = new LearningProgressDetailDto();

        if (progress != null)
        {
            result.Progress = new LearningProgressDto
            {
                Id = progress.Id,
                UserId = progress.UserId,
                UserName = progress.User != null ? progress.User.FullName ?? progress.User.Username : null,
                CertificateId = progress.CertificateId,
                CertificateName = progress.Certificate != null ? progress.Certificate.Name : null,
                CourseId = progress.CourseId,
                CourseName = progress.Course != null ? progress.Course.Name : null,
                CompletionRate = progress.CompletionRate,
                TargetRate = progress.TargetRate,
                StartDate = progress.StartDate,
                TargetDate = progress.TargetDate,
                Status = progress.Status,
                StatusText = GetStatusText(progress.Status),
                Note = progress.Note,
                CreatedAt = progress.CreatedAt,
                UpdatedAt = progress.UpdatedAt
            };

            if (progress.CourseId.HasValue)
            {
                result.Chapters = await _context.Chapters
                    .Where(c => c.CourseId == progress.CourseId.Value && c.IsActive)
                    .Include(c => c.QuestionTags)
                    .OrderBy(c => c.SortOrder)
                    .Select(c => new ChapterDto
                    {
                        Id = c.Id,
                        Title = c.Title,
                        Content = c.Content,
                        CourseId = c.CourseId,
                        ParentChapterId = c.ParentChapterId,
                        SortOrder = c.SortOrder,
                        EstimatedHours = c.EstimatedHours,
                        IsActive = c.IsActive,
                        QuestionTags = c.QuestionTags
                            .Where(qt => qt.IsActive)
                            .Select(qt => new QuestionTagDto
                            {
                                Id = qt.Id,
                                Name = qt.Name,
                                Description = qt.Description,
                                ChapterId = qt.ChapterId,
                                AssignmentId = qt.AssignmentId,
                                QuestionCount = qt.QuestionCount,
                                Difficulty = qt.Difficulty,
                                DifficultyText = GetDifficultyText(qt.Difficulty)
                            }).ToList()
                    })
                    .ToListAsync();

                result.AssignmentRecords = await _context.AssignmentRecords
                    .Where(ar => ar.UserId == progress.UserId)
                    .Include(ar => ar.Assignment)
                    .Where(ar => ar.Assignment != null && ar.Assignment.CourseId == progress.CourseId.Value)
                    .OrderByDescending(ar => ar.SubmittedAt ?? ar.CreatedAt)
                    .Select(ar => new AssignmentRecordDto
                    {
                        Id = ar.Id,
                        AssignmentId = ar.AssignmentId,
                        AssignmentTitle = ar.Assignment != null ? ar.Assignment.Title : null,
                        AssignmentType = ar.Assignment != null ? ar.Assignment.Type : 0,
                        AssignmentTypeText = ar.Assignment != null ? GetAssignmentTypeText(ar.Assignment.Type) : null,
                        UserId = ar.UserId,
                        CorrectCount = ar.CorrectCount,
                        TotalQuestions = ar.TotalQuestions,
                        Score = ar.Score,
                        StartedAt = ar.StartedAt,
                        SubmittedAt = ar.SubmittedAt,
                        Status = ar.Status,
                        StatusText = GetRecordStatusText(ar.Status),
                        Remark = ar.Remark
                    })
                    .ToListAsync();

                var chapterIds = result.Chapters.Select(c => c.Id).ToList();
                result.QuestionTags = await _context.QuestionTags
                    .Where(qt => qt.IsActive && (qt.ChapterId.HasValue && chapterIds.Contains(qt.ChapterId.Value)))
                    .Select(qt => new QuestionTagDto
                    {
                        Id = qt.Id,
                        Name = qt.Name,
                        Description = qt.Description,
                        ChapterId = qt.ChapterId,
                        AssignmentId = qt.AssignmentId,
                        QuestionCount = qt.QuestionCount,
                        Difficulty = qt.Difficulty,
                        DifficultyText = GetDifficultyText(qt.Difficulty)
                    })
                    .ToListAsync();
            }

            result.History = await _context.ProgressHistories
                .Where(ph => ph.LearningProgressId == id)
                .Include(ph => ph.ChangedBy)
                .OrderByDescending(ph => ph.ChangedAt)
                .Select(ph => new ProgressHistoryDto
                {
                    Id = ph.Id,
                    LearningProgressId = ph.LearningProgressId,
                    OldCompletionRate = ph.OldCompletionRate,
                    NewCompletionRate = ph.NewCompletionRate,
                    OldStatus = ph.OldStatus,
                    OldStatusText = GetStatusText(ph.OldStatus),
                    NewStatus = ph.NewStatus,
                    NewStatusText = GetStatusText(ph.NewStatus),
                    OldNote = ph.OldNote,
                    NewNote = ph.NewNote,
                    ChangedByUserId = ph.ChangedByUserId,
                    ChangedByName = ph.ChangedBy != null ? (ph.ChangedBy.FullName ?? ph.ChangedBy.Username) : null,
                    ChangeReason = ph.ChangeReason,
                    ChangedAt = ph.ChangedAt
                })
                .ToListAsync();
        }

        return result;
    }

    public async Task<LearningProgressDto> CreateAsync(LearningProgressCreateDto dto)
    {
        var progress = new LearningProgress
        {
            UserId = dto.UserId,
            CertificateId = dto.CertificateId,
            CourseId = dto.CourseId,
            CompletionRate = 0,
            TargetRate = dto.TargetRate,
            StartDate = dto.StartDate,
            TargetDate = dto.TargetDate,
            Status = ProgressStatus.NotStarted,
            Note = dto.Note,
            CreatedAt = DateTime.UtcNow
        };

        _context.LearningProgresses.Add(progress);
        await _context.SaveChangesAsync();

        var history = new ProgressHistory
        {
            LearningProgressId = progress.Id,
            OldCompletionRate = 0,
            NewCompletionRate = 0,
            OldStatus = ProgressStatus.NotStarted,
            NewStatus = ProgressStatus.NotStarted,
            ChangedByUserId = dto.UserId,
            ChangeReason = "创建学习计划",
            ChangedAt = DateTime.UtcNow
        };

        _context.ProgressHistories.Add(history);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(progress.Id) ?? throw new InvalidOperationException();
    }

    public async Task<LearningProgressDto?> UpdateProgressAsync(int id, LearningProgressUpdateDto dto)
    {
        var progress = await _context.LearningProgresses.FindAsync(id);
        if (progress == null) return null;

        var oldRate = progress.CompletionRate;
        var oldStatus = progress.Status;
        var oldNote = progress.Note;

        progress.CompletionRate = dto.CompletionRate;
        if (dto.Status.HasValue)
            progress.Status = dto.Status.Value;
        if (dto.Note != null)
            progress.Note = dto.Note;
        progress.UpdatedAt = DateTime.UtcNow;

        var newStatus = dto.Status ?? progress.Status;

        var history = new ProgressHistory
        {
            LearningProgressId = id,
            OldCompletionRate = oldRate,
            NewCompletionRate = dto.CompletionRate,
            OldStatus = oldStatus,
            NewStatus = newStatus,
            OldNote = oldNote,
            NewNote = dto.Note ?? oldNote,
            ChangedByUserId = dto.ChangedByUserId,
            ChangeReason = dto.ChangeReason,
            ChangedAt = DateTime.UtcNow
        };

        _context.ProgressHistories.Add(history);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(id);
    }

    public async Task<List<ProgressHistoryDto>> GetHistoryAsync(int progressId)
    {
        return await _context.ProgressHistories
            .Where(ph => ph.LearningProgressId == progressId)
            .Include(ph => ph.ChangedBy)
            .OrderByDescending(ph => ph.ChangedAt)
            .Select(ph => new ProgressHistoryDto
            {
                Id = ph.Id,
                LearningProgressId = ph.LearningProgressId,
                OldCompletionRate = ph.OldCompletionRate,
                NewCompletionRate = ph.NewCompletionRate,
                OldStatus = ph.OldStatus,
                OldStatusText = GetStatusText(ph.OldStatus),
                NewStatus = ph.NewStatus,
                NewStatusText = GetStatusText(ph.NewStatus),
                OldNote = ph.OldNote,
                NewNote = ph.NewNote,
                ChangedByUserId = ph.ChangedByUserId,
                ChangedByName = ph.ChangedBy != null ? (ph.ChangedBy.FullName ?? ph.ChangedBy.Username) : null,
                ChangeReason = ph.ChangeReason,
                ChangedAt = ph.ChangedAt
            })
            .ToListAsync();
    }

    public async Task<List<LearningProgressDto>> GetByUserAsync(int userId, int? certificateId = null)
    {
        var query = _context.LearningProgresses
            .Include(lp => lp.Certificate)
            .Include(lp => lp.Course)
            .Where(lp => lp.UserId == userId);

        if (certificateId.HasValue)
            query = query.Where(lp => lp.CertificateId == certificateId.Value);

        return await query
            .OrderByDescending(lp => lp.UpdatedAt ?? lp.CreatedAt)
            .Select(lp => new LearningProgressDto
            {
                Id = lp.Id,
                UserId = lp.UserId,
                CertificateId = lp.CertificateId,
                CertificateName = lp.Certificate != null ? lp.Certificate.Name : null,
                CourseId = lp.CourseId,
                CourseName = lp.Course != null ? lp.Course.Name : null,
                CompletionRate = lp.CompletionRate,
                TargetRate = lp.TargetRate,
                StartDate = lp.StartDate,
                TargetDate = lp.TargetDate,
                Status = lp.Status,
                StatusText = GetStatusText(lp.Status),
                Note = lp.Note,
                CreatedAt = lp.CreatedAt,
                UpdatedAt = lp.UpdatedAt
            })
            .ToListAsync();
    }

    private static string GetStatusText(ProgressStatus status)
    {
        return status switch
        {
            ProgressStatus.NotStarted => "未开始",
            ProgressStatus.InProgress => "进行中",
            ProgressStatus.OnTrack => "正常推进",
            ProgressStatus.Behind => "进度落后",
            ProgressStatus.Completed => "已完成",
            ProgressStatus.Paused => "已暂停",
            _ => "未知"
        };
    }

    private static string GetDifficultyText(TagDifficulty difficulty)
    {
        return difficulty switch
        {
            TagDifficulty.Easy => "简单",
            TagDifficulty.Medium => "中等",
            TagDifficulty.Hard => "困难",
            _ => "未知"
        };
    }

    private static string GetAssignmentTypeText(AssignmentType type)
    {
        return type switch
        {
            AssignmentType.Practice => "练习题",
            AssignmentType.MockExam => "模拟考试",
            AssignmentType.Homework => "课后作业",
            AssignmentType.Quiz => "小测验",
            _ => "未知"
        };
    }

    private static string GetRecordStatusText(RecordStatus status)
    {
        return status switch
        {
            RecordStatus.NotStarted => "未开始",
            RecordStatus.InProgress => "进行中",
            RecordStatus.Submitted => "已提交",
            RecordStatus.Reviewed => "已批阅",
            _ => "未知"
        };
    }
}
