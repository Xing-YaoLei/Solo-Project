using Microsoft.EntityFrameworkCore;
using CertSchedulePlatform.Data;
using CertSchedulePlatform.DTOs;
using CertSchedulePlatform.Entities;
using OfficeOpenXml;
using System.Text;
using System.Text.Json;

namespace CertSchedulePlatform.Services;

public class ExportService : IExportService
{
    private readonly AppDbContext _context;
    private readonly IMonthlyReviewService _monthlyReviewService;
    private readonly string _exportDirectory;

    public ExportService(AppDbContext context, IMonthlyReviewService monthlyReviewService)
    {
        _context = context;
        _monthlyReviewService = monthlyReviewService;
        _exportDirectory = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "exports");
        if (!Directory.Exists(_exportDirectory))
            Directory.CreateDirectory(_exportDirectory);

        ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
    }

    public async Task<ExportRecordDto> ExportLearningProgressAsync(ExportRequestDto request)
    {
        var query = _context.LearningProgresses
            .Include(lp => lp.User)
            .Include(lp => lp.Certificate)
            .Include(lp => lp.Course)
            .AsQueryable();

        if (request.CertificateId.HasValue)
            query = query.Where(lp => lp.CertificateId == request.CertificateId.Value);

        if (request.CourseId.HasValue)
            query = query.Where(lp => lp.CourseId == request.CourseId.Value);

        if (request.UserId.HasValue)
            query = query.Where(lp => lp.UserId == request.UserId.Value);

        if (request.StartDate.HasValue)
            query = query.Where(lp => lp.CreatedAt >= request.StartDate.Value);

        if (request.EndDate.HasValue)
            query = query.Where(lp => lp.CreatedAt <= request.EndDate.Value);

        var data = await query
            .OrderByDescending(lp => lp.UpdatedAt ?? lp.CreatedAt)
            .ToListAsync();

        var fileName = $"学习进度导出_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx";
        var filePath = Path.Combine(_exportDirectory, fileName);

        using (var package = new ExcelPackage())
        {
            var worksheet = package.Workbook.Worksheets.Add("学习进度");

            var headerRow = new[]
            {
                "ID", "学员", "证书", "课程", "完成率(%)", "目标率(%)",
                "开始日期", "目标日期", "状态", "备注", "创建时间", "更新时间"
            };

            for (int i = 0; i < headerRow.Length; i++)
            {
                worksheet.Cells[1, i + 1].Value = headerRow[i];
                worksheet.Cells[1, i + 1].Style.Font.Bold = true;
            }

            for (int i = 0; i < data.Count; i++)
            {
                var item = data[i];
                var row = i + 2;
                worksheet.Cells[row, 1].Value = item.Id;
                worksheet.Cells[row, 2].Value = item.User?.FullName ?? item.User?.Username ?? "";
                worksheet.Cells[row, 3].Value = item.Certificate?.Name ?? "";
                worksheet.Cells[row, 4].Value = item.Course?.Name ?? "";
                worksheet.Cells[row, 5].Value = (double)item.CompletionRate;
                worksheet.Cells[row, 6].Value = (double)item.TargetRate;
                worksheet.Cells[row, 7].Value = item.StartDate?.ToString("yyyy-MM-dd");
                worksheet.Cells[row, 8].Value = item.TargetDate?.ToString("yyyy-MM-dd");
                worksheet.Cells[row, 9].Value = GetProgressStatusText(item.Status);
                worksheet.Cells[row, 10].Value = item.Note ?? "";
                worksheet.Cells[row, 11].Value = item.CreatedAt.ToString("yyyy-MM-dd HH:mm");
                worksheet.Cells[row, 12].Value = item.UpdatedAt?.ToString("yyyy-MM-dd HH:mm");
            }

            var infoRow = data.Count + 4;
            worksheet.Cells[infoRow, 1].Value = "筛选条件：";
            worksheet.Cells[infoRow, 1].Style.Font.Bold = true;
            worksheet.Cells[infoRow + 1, 1].Value = BuildFilterDescription(request);
            worksheet.Cells[infoRow + 2, 1].Value = $"生成时间：{DateTime.Now:yyyy-MM-dd HH:mm:ss}";

            var user = await _context.Users.FindAsync(request.GeneratedByUserId);
            worksheet.Cells[infoRow + 3, 1].Value = $"操作人：{user?.FullName ?? user?.Username ?? "未知"}";

            worksheet.Cells[worksheet.Dimension.Address].AutoFitColumns();

            await package.SaveAsAsync(filePath);
        }

        var record = new ExportRecord
        {
            FileName = fileName,
            ExportType = ExportType.LearningProgress,
            FilterCriteria = BuildFilterDescription(request),
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            TotalRecords = data.Count,
            FilePath = filePath,
            GeneratedByUserId = request.GeneratedByUserId,
            GeneratedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(30)
        };

        _context.ExportRecords.Add(record);
        await _context.SaveChangesAsync();

        return await MapToDto(record);
    }

    public async Task<ExportRecordDto> ExportMonthlyReviewAsync(ExportRequestDto request)
    {
        var reviewQuery = new MonthlyReviewQueryDto
        {
            Year = request.StartDate?.Year ?? DateTime.Now.Year,
            Month = request.StartDate?.Month ?? DateTime.Now.Month,
            CertificateId = request.CertificateId,
            CourseId = request.CourseId
        };

        var review = await _monthlyReviewService.GetMonthlyReviewAsync(reviewQuery);

        var fileName = $"月度复盘_{review.Year}年{review.Month}月_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx";
        var filePath = Path.Combine(_exportDirectory, fileName);

        using (var package = new ExcelPackage())
        {
            var summarySheet = package.Workbook.Worksheets.Add("汇总");

            summarySheet.Cells[1, 1].Value = $"{review.Year}年{review.Month}月 月度复盘报告";
            summarySheet.Cells[1, 1].Style.Font.Size = 14;
            summarySheet.Cells[1, 1].Style.Font.Bold = true;

            var summaryData = new[]
            {
                new [] { "证书", review.CertificateName ?? "全部" },
                new [] { "总学员数", review.TotalStudents.ToString() },
                new [] { "正常推进", review.StudentsOnTrack.ToString() },
                new [] { "进度落后", review.StudentsBehind.ToString() },
                new [] { "已完成", review.StudentsCompleted.ToString() },
                new [] { "整体完成率", $"{review.OverallCompletionRate}%" },
                new [] { "作业总数", review.TotalAssignments.ToString() },
                new [] { "已完成作业", review.CompletedAssignments.ToString() },
                new [] { "作业完成率", $"{review.AssignmentCompletionRate}%" }
            };

            for (int i = 0; i < summaryData.Length; i++)
            {
                summarySheet.Cells[i + 3, 1].Value = summaryData[i][0];
                summarySheet.Cells[i + 3, 2].Value = summaryData[i][1];
                summarySheet.Cells[i + 3, 1].Style.Font.Bold = true;
            }

            var courseSheet = package.Workbook.Worksheets.Add("课程详情");

            var courseHeaders = new[]
            {
                "课程名称", "平均完成率", "学员数", "正常推进", "进度落后",
                "作业数", "已完成作业", "平均分"
            };

            for (int i = 0; i < courseHeaders.Length; i++)
            {
                courseSheet.Cells[1, i + 1].Value = courseHeaders[i];
                courseSheet.Cells[1, i + 1].Style.Font.Bold = true;
            }

            for (int i = 0; i < review.CourseReviews.Count; i++)
            {
                var course = review.CourseReviews[i];
                var row = i + 2;
                courseSheet.Cells[row, 1].Value = course.CourseName;
                courseSheet.Cells[row, 2].Value = $"{course.AverageCompletionRate}%";
                courseSheet.Cells[row, 3].Value = course.TotalStudents;
                courseSheet.Cells[row, 4].Value = course.StudentsOnTrack;
                courseSheet.Cells[row, 5].Value = course.StudentsBehind;
                courseSheet.Cells[row, 6].Value = course.AssignmentCount;
                courseSheet.Cells[row, 7].Value = course.CompletedAssignmentCount;
                courseSheet.Cells[row, 8].Value = course.AverageScore;
            }

            var infoRow = review.CourseReviews.Count + 4;
            courseSheet.Cells[infoRow, 1].Value = "筛选条件：";
            courseSheet.Cells[infoRow, 1].Style.Font.Bold = true;
            courseSheet.Cells[infoRow + 1, 1].Value = BuildFilterDescription(request);
            courseSheet.Cells[infoRow + 2, 1].Value = $"生成时间：{DateTime.Now:yyyy-MM-dd HH:mm:ss}";

            var user = await _context.Users.FindAsync(request.GeneratedByUserId);
            courseSheet.Cells[infoRow + 3, 1].Value = $"操作人：{user?.FullName ?? user?.Username ?? "未知"}";

            summarySheet.Cells[summarySheet.Dimension.Address].AutoFitColumns();
            courseSheet.Cells[courseSheet.Dimension.Address].AutoFitColumns();

            await package.SaveAsAsync(filePath);
        }

        var record = new ExportRecord
        {
            FileName = fileName,
            ExportType = ExportType.MonthlyReview,
            FilterCriteria = BuildFilterDescription(request),
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            TotalRecords = review.CourseReviews.Count,
            FilePath = filePath,
            GeneratedByUserId = request.GeneratedByUserId,
            GeneratedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(30)
        };

        _context.ExportRecords.Add(record);
        await _context.SaveChangesAsync();

        return await MapToDto(record);
    }

    public async Task<ExportRecordDto> ExportAssignmentRecordsAsync(ExportRequestDto request)
    {
        var query = _context.AssignmentRecords
            .Include(ar => ar.Assignment)
            .Include(ar => ar.User)
            .AsQueryable();

        if (request.CertificateId.HasValue)
        {
            var courseIds = await _context.Courses
                .Where(c => c.CertificateId == request.CertificateId.Value)
                .Select(c => c.Id)
                .ToListAsync();
            var assignmentIds = await _context.Assignments
                .Where(a => courseIds.Contains(a.CourseId))
                .Select(a => a.Id)
                .ToListAsync();
            query = query.Where(ar => assignmentIds.Contains(ar.AssignmentId));
        }

        if (request.CourseId.HasValue)
        {
            var assignmentIds = await _context.Assignments
                .Where(a => a.CourseId == request.CourseId.Value)
                .Select(a => a.Id)
                .ToListAsync();
            query = query.Where(ar => assignmentIds.Contains(ar.AssignmentId));
        }

        if (request.UserId.HasValue)
            query = query.Where(ar => ar.UserId == request.UserId.Value);

        if (request.StartDate.HasValue)
            query = query.Where(ar => ar.CreatedAt >= request.StartDate.Value);

        if (request.EndDate.HasValue)
            query = query.Where(ar => ar.CreatedAt <= request.EndDate.Value);

        var data = await query
            .OrderByDescending(ar => ar.SubmittedAt ?? ar.CreatedAt)
            .ToListAsync();

        var fileName = $"作业记录导出_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx";
        var filePath = Path.Combine(_exportDirectory, fileName);

        using (var package = new ExcelPackage())
        {
            var worksheet = package.Workbook.Worksheets.Add("作业记录");

            var headers = new[]
            {
                "ID", "学员", "作业名称", "作业类型", "正确数", "总题数",
                "得分", "状态", "开始时间", "提交时间", "备注"
            };

            for (int i = 0; i < headers.Length; i++)
            {
                worksheet.Cells[1, i + 1].Value = headers[i];
                worksheet.Cells[1, i + 1].Style.Font.Bold = true;
            }

            for (int i = 0; i < data.Count; i++)
            {
                var item = data[i];
                var row = i + 2;
                worksheet.Cells[row, 1].Value = item.Id;
                worksheet.Cells[row, 2].Value = item.User?.FullName ?? item.User?.Username ?? "";
                worksheet.Cells[row, 3].Value = item.Assignment?.Title ?? "";
                worksheet.Cells[row, 4].Value = GetAssignmentTypeText(item.Assignment?.Type ?? 0);
                worksheet.Cells[row, 5].Value = item.CorrectCount;
                worksheet.Cells[row, 6].Value = item.TotalQuestions;
                worksheet.Cells[row, 7].Value = (double)item.Score;
                worksheet.Cells[row, 8].Value = GetRecordStatusText(item.Status);
                worksheet.Cells[row, 9].Value = item.StartedAt?.ToString("yyyy-MM-dd HH:mm");
                worksheet.Cells[row, 10].Value = item.SubmittedAt?.ToString("yyyy-MM-dd HH:mm");
                worksheet.Cells[row, 11].Value = item.Remark ?? "";
            }

            var infoRow = data.Count + 4;
            worksheet.Cells[infoRow, 1].Value = "筛选条件：";
            worksheet.Cells[infoRow, 1].Style.Font.Bold = true;
            worksheet.Cells[infoRow + 1, 1].Value = BuildFilterDescription(request);
            worksheet.Cells[infoRow + 2, 1].Value = $"生成时间：{DateTime.Now:yyyy-MM-dd HH:mm:ss}";

            var user = await _context.Users.FindAsync(request.GeneratedByUserId);
            worksheet.Cells[infoRow + 3, 1].Value = $"操作人：{user?.FullName ?? user?.Username ?? "未知"}";

            worksheet.Cells[worksheet.Dimension.Address].AutoFitColumns();

            await package.SaveAsAsync(filePath);
        }

        var record = new ExportRecord
        {
            FileName = fileName,
            ExportType = ExportType.AssignmentRecords,
            FilterCriteria = BuildFilterDescription(request),
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            TotalRecords = data.Count,
            FilePath = filePath,
            GeneratedByUserId = request.GeneratedByUserId,
            GeneratedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(30)
        };

        _context.ExportRecords.Add(record);
        await _context.SaveChangesAsync();

        return await MapToDto(record);
    }

    public async Task<ExportRecordDto> ExportAlertsAsync(ExportRequestDto request)
    {
        var query = _context.ProgressAlerts
            .Include(a => a.User)
            .Include(a => a.LearningProgress)
                .ThenInclude(lp => lp.Certificate)
            .Include(a => a.LearningProgress)
                .ThenInclude(lp => lp.Course)
            .Include(a => a.ResolvedBy)
            .AsQueryable();

        if (request.StartDate.HasValue)
            query = query.Where(a => a.CreatedAt >= request.StartDate.Value);

        if (request.EndDate.HasValue)
            query = query.Where(a => a.CreatedAt <= request.EndDate.Value);

        if (request.UserId.HasValue)
            query = query.Where(a => a.UserId == request.UserId.Value);

        var data = await query
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

        var fileName = $"告警记录导出_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx";
        var filePath = Path.Combine(_exportDirectory, fileName);

        using (var package = new ExcelPackage())
        {
            var worksheet = package.Workbook.Worksheets.Add("告警记录");

            var headers = new[]
            {
                "ID", "学员", "证书", "课程", "告警类型", "严重程度",
                "当前完成率", "预期完成率", "落后率", "状态", "原因",
                "处理措施", "处理人", "创建时间", "关闭时间"
            };

            for (int i = 0; i < headers.Length; i++)
            {
                worksheet.Cells[1, i + 1].Value = headers[i];
                worksheet.Cells[1, i + 1].Style.Font.Bold = true;
            }

            for (int i = 0; i < data.Count; i++)
            {
                var item = data[i];
                var row = i + 2;
                worksheet.Cells[row, 1].Value = item.Id;
                worksheet.Cells[row, 2].Value = item.User?.FullName ?? item.User?.Username ?? "";
                worksheet.Cells[row, 3].Value = item.LearningProgress?.Certificate?.Name ?? "";
                worksheet.Cells[row, 4].Value = item.LearningProgress?.Course?.Name ?? "";
                worksheet.Cells[row, 5].Value = GetAlertTypeText(item.AlertType);
                worksheet.Cells[row, 6].Value = GetSeverityText(item.Severity);
                worksheet.Cells[row, 7].Value = $"{item.CurrentRate}%";
                worksheet.Cells[row, 8].Value = $"{item.ExpectedRate}%";
                worksheet.Cells[row, 9].Value = $"{item.BehindRate}%";
                worksheet.Cells[row, 10].Value = GetAlertStatusText(item.Status);
                worksheet.Cells[row, 11].Value = item.Reason ?? "";
                worksheet.Cells[row, 12].Value = item.ActionTaken ?? "";
                worksheet.Cells[row, 13].Value = item.ResolvedBy?.FullName ?? item.ResolvedBy?.Username ?? "";
                worksheet.Cells[row, 14].Value = item.CreatedAt.ToString("yyyy-MM-dd HH:mm");
                worksheet.Cells[row, 15].Value = item.ClosedAt?.ToString("yyyy-MM-dd HH:mm");
            }

            var infoRow = data.Count + 4;
            worksheet.Cells[infoRow, 1].Value = "筛选条件：";
            worksheet.Cells[infoRow, 1].Style.Font.Bold = true;
            worksheet.Cells[infoRow + 1, 1].Value = BuildFilterDescription(request);
            worksheet.Cells[infoRow + 2, 1].Value = $"生成时间：{DateTime.Now:yyyy-MM-dd HH:mm:ss}";

            var user = await _context.Users.FindAsync(request.GeneratedByUserId);
            worksheet.Cells[infoRow + 3, 1].Value = $"操作人：{user?.FullName ?? user?.Username ?? "未知"}";

            worksheet.Cells[worksheet.Dimension.Address].AutoFitColumns();

            await package.SaveAsAsync(filePath);
        }

        var record = new ExportRecord
        {
            FileName = fileName,
            ExportType = ExportType.Alerts,
            FilterCriteria = BuildFilterDescription(request),
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            TotalRecords = data.Count,
            FilePath = filePath,
            GeneratedByUserId = request.GeneratedByUserId,
            GeneratedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(30)
        };

        _context.ExportRecords.Add(record);
        await _context.SaveChangesAsync();

        return await MapToDto(record);
    }

    public async Task<byte[]> DownloadExportAsync(int exportId)
    {
        var record = await _context.ExportRecords.FindAsync(exportId);
        if (record == null || string.IsNullOrEmpty(record.FilePath) || !File.Exists(record.FilePath))
            throw new FileNotFoundException("导出文件不存在");

        return await File.ReadAllBytesAsync(record.FilePath);
    }

    public async Task<PagedResult<ExportRecordDto>> GetExportHistoryAsync(int pageIndex, int pageSize, ExportType? type = null)
    {
        var query = _context.ExportRecords
            .Include(e => e.GeneratedBy)
            .AsQueryable();

        if (type.HasValue)
            query = query.Where(e => e.ExportType == type.Value);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(e => e.GeneratedAt)
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .Select(e => new ExportRecordDto
            {
                Id = e.Id,
                FileName = e.FileName,
                ExportType = e.ExportType,
                ExportTypeText = GetExportTypeText(e.ExportType),
                FilterCriteria = e.FilterCriteria,
                StartDate = e.StartDate,
                EndDate = e.EndDate,
                TotalRecords = e.TotalRecords,
                GeneratedByUserId = e.GeneratedByUserId,
                GeneratedByName = e.GeneratedBy != null ? e.GeneratedBy.FullName ?? e.GeneratedBy.Username : null,
                GeneratedAt = e.GeneratedAt,
                ExpiresAt = e.ExpiresAt
            })
            .ToListAsync();

        return new PagedResult<ExportRecordDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageIndex = pageIndex,
            PageSize = pageSize
        };
    }

    private async Task<ExportRecordDto> MapToDto(ExportRecord record)
    {
        var user = record.GeneratedBy ?? await _context.Users.FindAsync(record.GeneratedByUserId);
        return new ExportRecordDto
        {
            Id = record.Id,
            FileName = record.FileName,
            ExportType = record.ExportType,
            ExportTypeText = GetExportTypeText(record.ExportType),
            FilterCriteria = record.FilterCriteria,
            StartDate = record.StartDate,
            EndDate = record.EndDate,
            TotalRecords = record.TotalRecords,
            GeneratedByUserId = record.GeneratedByUserId,
            GeneratedByName = user?.FullName ?? user?.Username,
            GeneratedAt = record.GeneratedAt,
            ExpiresAt = record.ExpiresAt
        };
    }

    private static string BuildFilterDescription(ExportRequestDto request)
    {
        var filters = new List<string>();

        if (request.StartDate.HasValue && request.EndDate.HasValue)
            filters.Add($"时间范围：{request.StartDate.Value:yyyy-MM-dd} 至 {request.EndDate.Value:yyyy-MM-dd}");
        else if (request.StartDate.HasValue)
            filters.Add($"开始时间：{request.StartDate.Value:yyyy-MM-dd}");
        else if (request.EndDate.HasValue)
            filters.Add($"结束时间：{request.EndDate.Value:yyyy-MM-dd}");

        if (request.CertificateId.HasValue)
            filters.Add($"证书ID：{request.CertificateId}");

        if (request.CourseId.HasValue)
            filters.Add($"课程ID：{request.CourseId}");

        if (request.UserId.HasValue)
            filters.Add($"用户ID：{request.UserId}");

        if (!string.IsNullOrEmpty(request.AdditionalFilters))
            filters.Add(request.AdditionalFilters);

        return filters.Any() ? string.Join("；", filters) : "全部数据";
    }

    private static string GetExportTypeText(ExportType type)
    {
        return type switch
        {
            ExportType.LearningProgress => "学习进度",
            ExportType.MonthlyReview => "月度复盘",
            ExportType.AssignmentRecords => "作业记录",
            ExportType.Alerts => "告警记录",
            _ => "未知"
        };
    }

    private static string GetProgressStatusText(ProgressStatus status)
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

    private static string GetAlertTypeText(AlertType type)
    {
        return type switch
        {
            AlertType.ProgressBehind => "进度落后",
            AlertType.DeadlineApproaching => "即将截止",
            AlertType.NoActivity => "无学习活动",
            AlertType.ScoreDrop => "成绩下滑",
            _ => "未知"
        };
    }

    private static string GetSeverityText(AlertSeverity severity)
    {
        return severity switch
        {
            AlertSeverity.Low => "低",
            AlertSeverity.Medium => "中",
            AlertSeverity.High => "高",
            AlertSeverity.Critical => "严重",
            _ => "未知"
        };
    }

    private static string GetAlertStatusText(AlertStatus status)
    {
        return status switch
        {
            AlertStatus.Open => "待处理",
            AlertStatus.InProgress => "处理中",
            AlertStatus.Resolved => "已解决",
            AlertStatus.Closed => "已关闭",
            AlertStatus.Ignored => "已忽略",
            _ => "未知"
        };
    }
}
