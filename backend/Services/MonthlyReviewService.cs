using Microsoft.EntityFrameworkCore;
using CertSchedulePlatform.Data;
using CertSchedulePlatform.DTOs;
using CertSchedulePlatform.Entities;

namespace CertSchedulePlatform.Services;

public class MonthlyReviewService : IMonthlyReviewService
{
    private readonly AppDbContext _context;

    public MonthlyReviewService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<MonthlyReviewDto> GetMonthlyReviewAsync(MonthlyReviewQueryDto query)
    {
        var result = new MonthlyReviewDto
        {
            Year = query.Year,
            Month = query.Month,
            CertificateId = query.CertificateId ?? 0
        };

        if (query.CertificateId.HasValue)
        {
            var cert = await _context.Certificates.FindAsync(query.CertificateId.Value);
            result.CertificateName = cert?.Name;
        }

        var monthStart = new DateTime(query.Year, query.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var monthEnd = monthStart.AddMonths(1).AddDays(-1);

        var progressQuery = _context.LearningProgresses
            .Include(lp => lp.User)
            .AsQueryable();

        if (query.CertificateId.HasValue)
            progressQuery = progressQuery.Where(lp => lp.CertificateId == query.CertificateId.Value);

        if (query.CourseId.HasValue)
            progressQuery = progressQuery.Where(lp => lp.CourseId == query.CourseId.Value);

        var allProgresses = await progressQuery.ToListAsync();

        result.TotalStudents = allProgresses.Select(lp => lp.UserId).Distinct().Count();
        result.StudentsOnTrack = allProgresses.Count(lp => lp.Status == ProgressStatus.OnTrack);
        result.StudentsBehind = allProgresses.Count(lp => lp.Status == ProgressStatus.Behind);
        result.StudentsCompleted = allProgresses.Count(lp => lp.Status == ProgressStatus.Completed);

        if (allProgresses.Any())
        {
            result.OverallCompletionRate = Math.Round(allProgresses.Average(lp => lp.CompletionRate), 1);
        }

        var courseIds = allProgresses
            .Where(lp => lp.CourseId.HasValue)
            .Select(lp => lp.CourseId!.Value)
            .Distinct()
            .ToList();

        foreach (var courseId in courseIds)
        {
            var courseProgresses = allProgresses.Where(lp => lp.CourseId == courseId).ToList();
            var course = await _context.Courses.FindAsync(courseId);

            var assignments = await _context.Assignments
                .Where(a => a.CourseId == courseId && a.IsActive)
                .ToListAsync();

            var assignmentRecords = await _context.AssignmentRecords
                .Where(ar => assignments.Select(a => a.Id).Contains(ar.AssignmentId))
                .Where(ar => courseProgresses.Select(lp => lp.UserId).Contains(ar.UserId))
                .Where(ar => ar.CreatedAt >= monthStart && ar.CreatedAt <= monthEnd)
                .ToListAsync();

            var completedAssignments = assignmentRecords
                .Where(ar => ar.Status == RecordStatus.Submitted || ar.Status == RecordStatus.Reviewed)
                .Count();

            var courseReview = new CourseReviewDto
            {
                CourseId = courseId,
                CourseName = course?.Name,
                AverageCompletionRate = Math.Round(courseProgresses.Average(lp => lp.CompletionRate), 1),
                TotalStudents = courseProgresses.Count,
                StudentsOnTrack = courseProgresses.Count(lp => lp.Status == ProgressStatus.OnTrack),
                StudentsBehind = courseProgresses.Count(lp => lp.Status == ProgressStatus.Behind),
                AssignmentCount = assignments.Count,
                CompletedAssignmentCount = completedAssignments,
                AverageScore = assignmentRecords.Any()
                    ? Math.Round(assignmentRecords.Average(ar => ar.Score), 1)
                    : 0
            };

            result.CourseReviews.Add(courseReview);
        }

        var totalAssignmentCount = result.CourseReviews.Sum(c => c.AssignmentCount);
        var totalCompletedCount = result.CourseReviews.Sum(c => c.CompletedAssignmentCount);

        result.TotalAssignments = totalAssignmentCount;
        result.CompletedAssignments = totalCompletedCount;
        result.AssignmentCompletionRate = totalAssignmentCount > 0
            ? Math.Round((decimal)totalCompletedCount / totalAssignmentCount * 100, 1)
            : 0;

        return result;
    }

    public async Task<List<CourseReviewDto>> GetCourseReviewsAsync(int year, int month, int certificateId)
    {
        var monthStart = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
        var monthEnd = monthStart.AddMonths(1).AddDays(-1);

        var courses = await _context.Courses
            .Where(c => c.CertificateId == certificateId && c.IsActive)
            .OrderBy(c => c.SortOrder)
            .ToListAsync();

        var result = new List<CourseReviewDto>();

        foreach (var course in courses)
        {
            var progresses = await _context.LearningProgresses
                .Where(lp => lp.CourseId == course.Id)
                .ToListAsync();

            var assignments = await _context.Assignments
                .Where(a => a.CourseId == course.Id && a.IsActive)
                .ToListAsync();

            var userIds = progresses.Select(lp => lp.UserId).Distinct().ToList();

            var assignmentRecords = await _context.AssignmentRecords
                .Where(ar => assignments.Select(a => a.Id).Contains(ar.AssignmentId))
                .Where(ar => userIds.Contains(ar.UserId))
                .Where(ar => ar.CreatedAt >= monthStart && ar.CreatedAt <= monthEnd)
                .ToListAsync();

            var completedCount = assignmentRecords
                .Count(ar => ar.Status == RecordStatus.Submitted || ar.Status == RecordStatus.Reviewed);

            result.Add(new CourseReviewDto
            {
                CourseId = course.Id,
                CourseName = course.Name,
                AverageCompletionRate = progresses.Any() ? Math.Round(progresses.Average(lp => lp.CompletionRate), 1) : 0,
                TotalStudents = progresses.Count,
                StudentsOnTrack = progresses.Count(lp => lp.Status == ProgressStatus.OnTrack),
                StudentsBehind = progresses.Count(lp => lp.Status == ProgressStatus.Behind),
                AssignmentCount = assignments.Count,
                CompletedAssignmentCount = completedCount,
                AverageScore = assignmentRecords.Any() ? Math.Round(assignmentRecords.Average(ar => ar.Score), 1) : 0
            });
        }

        return result;
    }
}
