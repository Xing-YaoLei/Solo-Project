using Microsoft.EntityFrameworkCore;
using EduSchedule.API.Data;
using EduSchedule.API.Models;
using EduSchedule.API.Enums;

namespace EduSchedule.API.Services;

public class ScheduleService : IScheduleService
{
    private readonly AppDbContext _context;
    private readonly IConflictDetectionService _conflictService;
    private readonly IApprovalService _approvalService;

    public ScheduleService(AppDbContext context, IConflictDetectionService conflictService, IApprovalService approvalService)
    {
        _context = context;
        _conflictService = conflictService;
        _approvalService = approvalService;
    }

    public async Task<CourseSchedule> CreateScheduleAsync(CourseSchedule schedule, CancellationToken cancellationToken = default)
    {
        var hasConflict = await CheckScheduleConflictAsync(schedule, cancellationToken);
        if (hasConflict)
        {
            schedule.ApprovalStatus = ApprovalStatus.Draft;
        }

        _context.CourseSchedules.Add(schedule);
        await _context.SaveChangesAsync(cancellationToken);

        if (hasConflict)
        {
            await _conflictService.DetectAndCreateConflictsForScheduleAsync(schedule, cancellationToken);
        }

        return schedule;
    }

    public async Task<CourseSchedule> UpdateScheduleAsync(CourseSchedule schedule, CancellationToken cancellationToken = default)
    {
        var existing = await _context.CourseSchedules.FindAsync(new object[] { schedule.Id }, cancellationToken);
        if (existing == null)
            throw new KeyNotFoundException($"Schedule with id {schedule.Id} not found");

        existing.CourseId = schedule.CourseId;
        existing.ClassroomId = schedule.ClassroomId;
        existing.TimeSlotId = schedule.TimeSlotId;
        existing.SemesterId = schedule.SemesterId;
        existing.DayOfWeek = schedule.DayOfWeek;
        existing.Weeks = schedule.Weeks;
        existing.StartWeek = schedule.StartWeek;
        existing.EndWeek = schedule.EndWeek;
        existing.UpdatedAt = DateTime.UtcNow;

        var hasConflict = await CheckScheduleConflictAsync(existing, cancellationToken);
        existing.ApprovalStatus = hasConflict ? ApprovalStatus.Draft : ApprovalStatus.Draft;

        await _context.SaveChangesAsync(cancellationToken);

        var existingConflicts = await _context.Conflicts
            .Where(c => c.Schedule1Id == schedule.Id || c.Schedule2Id == schedule.Id)
            .Where(c => c.Status != ConflictStatus.Resolved && c.Status != ConflictStatus.Rejected)
            .ToListAsync(cancellationToken);

        foreach (var conflict in existingConflicts)
        {
            conflict.Status = ConflictStatus.Pending;
            conflict.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);

        if (hasConflict)
        {
            await _conflictService.DetectAndCreateConflictsForScheduleAsync(existing, cancellationToken);
        }

        return existing;
    }

    public async Task<bool> DeleteScheduleAsync(int id, CancellationToken cancellationToken = default)
    {
        var schedule = await _context.CourseSchedules.FindAsync(new object[] { id }, cancellationToken);
        if (schedule == null) return false;

        var conflicts = await _context.Conflicts
            .Where(c => c.Schedule1Id == id || c.Schedule2Id == id)
            .ToListAsync(cancellationToken);

        foreach (var conflict in conflicts)
        {
            _context.Conflicts.Remove(conflict);
        }

        _context.CourseSchedules.Remove(schedule);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<CourseSchedule?> GetScheduleByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.CourseSchedules
            .Include(s => s.Course)
                .ThenInclude(c => c.TeacherCourses)
                    .ThenInclude(tc => tc.Teacher)
            .Include(s => s.Classroom)
            .Include(s => s.TimeSlot)
            .Include(s => s.Semester)
            .Include(s => s.ApprovalRecords)
                .ThenInclude(ar => ar.Approver)
            .Include(s => s.Conflicts)
                .ThenInclude(c => c.Classroom)
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
    }

    public async Task<IEnumerable<CourseSchedule>> GetSchedulesAsync(int? semesterId = null, int? courseId = null, int? classroomId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.CourseSchedules
            .Include(s => s.Course)
            .Include(s => s.Classroom)
            .Include(s => s.TimeSlot)
            .Include(s => s.Conflicts)
            .AsQueryable();

        if (semesterId.HasValue)
            query = query.Where(s => s.SemesterId == semesterId.Value);
        if (courseId.HasValue)
            query = query.Where(s => s.CourseId == courseId.Value);
        if (classroomId.HasValue)
            query = query.Where(s => s.ClassroomId == classroomId.Value);

        return await query.OrderBy(s => s.DayOfWeek).ThenBy(s => s.TimeSlotId).ToListAsync(cancellationToken);
    }

    public async Task SubmitForApprovalAsync(int scheduleId, int userId, CancellationToken cancellationToken = default)
    {
        var schedule = await _context.CourseSchedules.FindAsync(new object[] { scheduleId }, cancellationToken);
        if (schedule == null)
            throw new KeyNotFoundException($"Schedule with id {scheduleId} not found");

        var hasConflict = await CheckScheduleConflictAsync(schedule, cancellationToken);
        if (hasConflict)
            throw new InvalidOperationException("Cannot submit schedule with unresolved conflicts");

        schedule.ApprovalStatus = ApprovalStatus.Pending;
        schedule.UpdatedAt = DateTime.UtcNow;

        await _approvalService.CreateApprovalRecordAsync(scheduleId, userId, ApprovalStatus.Pending, 1, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task ApproveScheduleAsync(int scheduleId, int approverId, string? comments = null, CancellationToken cancellationToken = default)
    {
        var schedule = await _context.CourseSchedules.FindAsync(new object[] { scheduleId }, cancellationToken);
        if (schedule == null)
            throw new KeyNotFoundException($"Schedule with id {scheduleId} not found");

        schedule.ApprovalStatus = ApprovalStatus.Approved;
        schedule.UpdatedAt = DateTime.UtcNow;

        var course = await _context.Courses.FindAsync(new object[] { schedule.CourseId }, cancellationToken);
        if (course != null)
        {
            course.Status = CourseStatus.Scheduled;
        }

        await _approvalService.CreateApprovalRecordAsync(scheduleId, approverId, ApprovalStatus.Approved, 1, comments, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task RejectScheduleAsync(int scheduleId, int approverId, string comments, CancellationToken cancellationToken = default)
    {
        var schedule = await _context.CourseSchedules.FindAsync(new object[] { scheduleId }, cancellationToken);
        if (schedule == null)
            throw new KeyNotFoundException($"Schedule with id {scheduleId} not found");

        schedule.ApprovalStatus = ApprovalStatus.Rejected;
        schedule.UpdatedAt = DateTime.UtcNow;

        await _approvalService.CreateApprovalRecordAsync(scheduleId, approverId, ApprovalStatus.Rejected, 1, comments, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<IEnumerable<Conflict>> DetectConflictsAsync(int semesterId, CancellationToken cancellationToken = default)
    {
        var schedules = await _context.CourseSchedules
            .Where(s => s.SemesterId == semesterId)
            .Include(s => s.Classroom)
            .Include(s => s.TimeSlot)
            .Include(s => s.Course)
                .ThenInclude(c => c.TeacherCourses)
                    .ThenInclude(tc => tc.Teacher)
            .ToListAsync(cancellationToken);

        var conflicts = new List<Conflict>();
        var processedPairs = new HashSet<(int, int)>();

        foreach (var schedule1 in schedules)
        {
            foreach (var schedule2 in schedules.Where(s => s.Id > schedule1.Id))
            {
                var pairKey = (schedule1.Id, schedule2.Id);
                if (processedPairs.Contains(pairKey)) continue;
                processedPairs.Add(pairKey);

                var conflict = await _conflictService.CheckConflictAsync(schedule1, schedule2, cancellationToken);
                if (conflict != null)
                {
                    conflicts.Add(conflict);
                }
            }
        }

        return conflicts;
    }

    public async Task<bool> CheckScheduleConflictAsync(CourseSchedule schedule, CancellationToken cancellationToken = default)
    {
        var existingSchedules = await _context.CourseSchedules
            .Where(s => s.SemesterId == schedule.SemesterId
                && s.ClassroomId == schedule.ClassroomId
                && s.DayOfWeek == schedule.DayOfWeek
                && s.TimeSlotId == schedule.TimeSlotId
                && s.Id != schedule.Id)
            .Include(s => s.Course)
            .Include(s => s.TimeSlot)
            .ToListAsync(cancellationToken);

        foreach (var existing in existingSchedules)
        {
            if (WeeksOverlap(schedule, existing))
            {
                return true;
            }
        }

        var course = await _context.Courses
            .Include(c => c.TeacherCourses)
            .FirstOrDefaultAsync(c => c.Id == schedule.CourseId, cancellationToken);

        if (course?.TeacherCourses != null)
        {
            var teacherIds = course.TeacherCourses.Select(tc => tc.UserId).ToList();
            foreach (var teacherId in teacherIds)
            {
                var teacherSchedules = await _context.CourseSchedules
                    .Where(s => s.SemesterId == schedule.SemesterId
                        && s.DayOfWeek == schedule.DayOfWeek
                        && s.TimeSlotId == schedule.TimeSlotId
                        && s.Id != schedule.Id)
                    .Include(s => s.Course)
                        .ThenInclude(c => c.TeacherCourses)
                    .ToListAsync(cancellationToken);

                foreach (var ts in teacherSchedules)
                {
                    if (ts.Course.TeacherCourses.Any(tc => tc.UserId == teacherId) && WeeksOverlap(schedule, ts))
                    {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    public async Task<IEnumerable<CourseSchedule>> GetWeeklyScheduleAsync(int semesterId, int? classroomId = null, int? courseId = null, int? teacherId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.CourseSchedules
            .Include(s => s.Course)
                .ThenInclude(c => c.TeacherCourses)
                    .ThenInclude(tc => tc.Teacher)
            .Include(s => s.Classroom)
            .Include(s => s.TimeSlot)
            .Where(s => s.SemesterId == semesterId)
            .AsQueryable();

        if (classroomId.HasValue)
            query = query.Where(s => s.ClassroomId == classroomId.Value);
        if (courseId.HasValue)
            query = query.Where(s => s.CourseId == courseId.Value);
        if (teacherId.HasValue)
            query = query.Where(s => s.Course.TeacherCourses.Any(tc => tc.UserId == teacherId.Value));

        return await query
            .OrderBy(s => s.DayOfWeek)
            .ThenBy(s => s.TimeSlotId)
            .ToListAsync(cancellationToken);
    }

    private static bool WeeksOverlap(CourseSchedule s1, CourseSchedule s2)
    {
        return s1.StartWeek <= s2.EndWeek && s2.StartWeek <= s1.EndWeek;
    }
}
