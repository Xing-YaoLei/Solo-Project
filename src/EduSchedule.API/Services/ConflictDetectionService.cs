using Microsoft.EntityFrameworkCore;
using EduSchedule.API.Data;
using EduSchedule.API.Models;
using EduSchedule.API.Enums;

namespace EduSchedule.API.Services;

public class ConflictDetectionService : IConflictDetectionService
{
    private readonly AppDbContext _context;

    public ConflictDetectionService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Conflict?> CheckConflictAsync(CourseSchedule schedule1, CourseSchedule schedule2, CancellationToken cancellationToken = default)
    {
        if (schedule1.Id == schedule2.Id) return null;
        if (schedule1.SemesterId != schedule2.SemesterId) return null;

        var weeksOverlap = schedule1.StartWeek <= schedule2.EndWeek && schedule2.StartWeek <= schedule1.EndWeek;
        if (!weeksOverlap) return null;

        ConflictType? conflictType = null;
        string description = string.Empty;

        if (schedule1.ClassroomId == schedule2.ClassroomId &&
            schedule1.DayOfWeek == schedule2.DayOfWeek &&
            schedule1.TimeSlotId == schedule2.TimeSlotId)
        {
            conflictType = ConflictType.ClassroomConflict;
            var classroom = await _context.Classrooms.FindAsync(new object[] { schedule1.ClassroomId }, cancellationToken);
            description = $"教室 {classroom?.RoomNumber} 在 {schedule1.DayOfWeek} 第 {schedule1.TimeSlotId} 节发生时间冲突";
        }

        if (conflictType == null)
        {
            var course1Teachers = await _context.TeacherCourses
                .Where(tc => tc.CourseId == schedule1.CourseId)
                .Select(tc => tc.UserId)
                .ToListAsync(cancellationToken);

            var course2Teachers = await _context.TeacherCourses
                .Where(tc => tc.CourseId == schedule2.CourseId)
                .Select(tc => tc.UserId)
                .ToListAsync(cancellationToken);

            var commonTeachers = course1Teachers.Intersect(course2Teachers).ToList();
            if (commonTeachers.Any() &&
                schedule1.DayOfWeek == schedule2.DayOfWeek &&
                schedule1.TimeSlotId == schedule2.TimeSlotId)
            {
                conflictType = ConflictType.TeacherConflict;
                var teacherNames = await _context.Users
                    .Where(u => commonTeachers.Contains(u.Id))
                    .Select(u => u.RealName)
                    .ToListAsync(cancellationToken);
                description = $"教师 {string.Join(", ", teacherNames)} 在 {schedule1.DayOfWeek} 第 {schedule1.TimeSlotId} 节发生时间冲突";
            }
        }

        if (!conflictType.HasValue) return null;

        var course1 = await _context.Courses.FindAsync(new object[] { schedule1.CourseId }, cancellationToken);
        var course2 = await _context.Courses.FindAsync(new object[] { schedule2.CourseId }, cancellationToken);

        var conflict = new Conflict
        {
            Title = $"{course1?.Name} 与 {course2?.Name} 的排课冲突",
            Description = description,
            Type = conflictType.Value,
            ClassroomId = schedule1.ClassroomId,
            Schedule1Id = schedule1.Id,
            Schedule2Id = schedule2.Id,
            DayOfWeek = schedule1.DayOfWeek,
            TimeSlotId = schedule1.TimeSlotId,
            Status = ConflictStatus.Pending,
            Level = ConflictLevel.Medium
        };

        conflict.Level = await CalculateConflictLevelAsync(conflict, cancellationToken);

        return conflict;
    }

    public async Task DetectAndCreateConflictsForScheduleAsync(CourseSchedule schedule, CancellationToken cancellationToken = default)
    {
        var existingSchedules = await _context.CourseSchedules
            .Where(s => s.SemesterId == schedule.SemesterId && s.Id != schedule.Id)
            .Include(s => s.Classroom)
            .Include(s => s.TimeSlot)
            .ToListAsync(cancellationToken);

        foreach (var existing in existingSchedules)
        {
            var conflict = await CheckConflictAsync(schedule, existing, cancellationToken);
            if (conflict != null)
            {
                var exists = await _context.Conflicts
                    .AnyAsync(c =>
                        (c.Schedule1Id == schedule.Id && c.Schedule2Id == existing.Id) ||
                        (c.Schedule1Id == existing.Id && c.Schedule2Id == schedule.Id),
                        cancellationToken);

                if (!exists)
                {
                    _context.Conflicts.Add(conflict);
                    await _context.SaveChangesAsync(cancellationToken);
                }
            }
        }
    }

    public async Task<IEnumerable<Conflict>> DetectAllConflictsAsync(int semesterId, CancellationToken cancellationToken = default)
    {
        var schedules = await _context.CourseSchedules
            .Where(s => s.SemesterId == semesterId)
            .ToListAsync(cancellationToken);

        var conflicts = new List<Conflict>();
        var processedPairs = new HashSet<(int, int)>();

        foreach (var s1 in schedules)
        {
            foreach (var s2 in schedules.Where(s => s.Id > s1.Id))
            {
                var pair = (s1.Id, s2.Id);
                if (processedPairs.Contains(pair)) continue;
                processedPairs.Add(pair);

                var conflict = await CheckConflictAsync(s1, s2, cancellationToken);
                if (conflict != null)
                {
                    var exists = await _context.Conflicts
                        .AnyAsync(c =>
                            (c.Schedule1Id == s1.Id && c.Schedule2Id == s2.Id) ||
                            (c.Schedule1Id == s2.Id && c.Schedule2Id == s1.Id),
                            cancellationToken);

                    if (!exists)
                    {
                        _context.Conflicts.Add(conflict);
                        conflicts.Add(conflict);
                    }
                }
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
        return conflicts;
    }

    public async Task<ConflictLevel> CalculateConflictLevelAsync(Conflict conflict, CancellationToken cancellationToken = default)
    {
        int score = 0;

        if (conflict.Type == ConflictType.ClassroomConflict)
        {
            var classroom = await _context.Classrooms.FindAsync(new object[] { conflict.ClassroomId }, cancellationToken);
            if (classroom != null)
            {
                if (classroom.Type == RoomType.Laboratory || classroom.Type == RoomType.ComputerLab)
                    score += 20;
                if (classroom.Capacity < 30) score += 10;
            }
        }

        if (conflict.Type == ConflictType.TeacherConflict)
            score += 30;

        var schedule1 = await _context.CourseSchedules
            .Include(s => s.Course)
            .FirstOrDefaultAsync(s => s.Id == conflict.Schedule1Id, cancellationToken);
        var schedule2 = await _context.CourseSchedules
            .Include(s => s.Course)
            .FirstOrDefaultAsync(s => s.Id == conflict.Schedule2Id, cancellationToken);

        if (schedule1?.Course?.MaxStudents > 50 || schedule2?.Course?.MaxStudents > 50)
            score += 20;

        if (schedule1?.Course?.Credits > 3 || schedule2?.Course?.Credits > 3)
            score += 10;

        var existingResolved = await _context.Conflicts
            .Where(c => (c.Schedule1Id == conflict.Schedule1Id || c.Schedule2Id == conflict.Schedule1Id ||
                        c.Schedule1Id == conflict.Schedule2Id || c.Schedule2Id == conflict.Schedule2Id)
                        && c.Status == ConflictStatus.Resolved)
            .CountAsync(cancellationToken);

        score += existingResolved * 5;

        return score switch
        {
            < 20 => ConflictLevel.Low,
            < 40 => ConflictLevel.Medium,
            < 60 => ConflictLevel.High,
            _ => ConflictLevel.Critical
        };
    }

    public async Task AssignConflictToUserAsync(int conflictId, int userId, CancellationToken cancellationToken = default)
    {
        var conflict = await _context.Conflicts.FindAsync(new object[] { conflictId }, cancellationToken);
        if (conflict == null)
            throw new KeyNotFoundException($"Conflict with id {conflictId} not found");

        conflict.AssignedTo = userId;
        conflict.Status = ConflictStatus.UnderReview;
        conflict.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task ResolveConflictAsync(int conflictId, int userId, string resolution, CancellationToken cancellationToken = default)
    {
        var conflict = await _context.Conflicts.FindAsync(new object[] { conflictId }, cancellationToken);
        if (conflict == null)
            throw new KeyNotFoundException($"Conflict with id {conflictId} not found");

        conflict.Status = ConflictStatus.Resolved;
        conflict.Resolution = resolution;
        conflict.ResolvedAt = DateTime.UtcNow;
        conflict.ResolvedBy = userId;
        conflict.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task AddCommunicationAsync(int conflictId, int userId, string message, CommunicationType type = CommunicationType.Comment, CancellationToken cancellationToken = default)
    {
        var communication = new ConflictCommunication
        {
            ConflictId = conflictId,
            UserId = userId,
            Message = message,
            Type = type,
            CreatedAt = DateTime.UtcNow
        };

        _context.ConflictCommunications.Add(communication);

        var conflict = await _context.Conflicts.FindAsync(new object[] { conflictId }, cancellationToken);
        if (conflict != null)
        {
            conflict.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task AddReviewAsync(int conflictId, int reviewerId, string opinion, ReviewResult result, string? suggestions = null, CancellationToken cancellationToken = default)
    {
        var review = new ConflictReview
        {
            ConflictId = conflictId,
            ReviewerId = reviewerId,
            ReviewOpinion = opinion,
            Result = result,
            Suggestions = suggestions,
            CreatedAt = DateTime.UtcNow
        };

        _context.ConflictReviews.Add(review);

        var conflict = await _context.Conflicts.FindAsync(new object[] { conflictId }, cancellationToken);
        if (conflict != null)
        {
            if (result == ReviewResult.Approved)
            {
                conflict.Status = ConflictStatus.Resolved;
                conflict.ResolvedAt = DateTime.UtcNow;
                conflict.ResolvedBy = reviewerId;
            }
            else if (result == ReviewResult.EscalateToHigherLevel)
            {
                conflict.Status = ConflictStatus.Escalated;
            }
            conflict.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<Conflict?> GetConflictByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Conflicts
            .Include(c => c.Classroom)
            .Include(c => c.Schedule1)
                .ThenInclude(s => s!.Course)
                    .ThenInclude(c => c!.TeacherCourses)
                        .ThenInclude(tc => tc.Teacher)
            .Include(c => c.Schedule2)
                .ThenInclude(s => s!.Course)
                    .ThenInclude(c => c!.TeacherCourses)
                        .ThenInclude(tc => tc.Teacher)
            .Include(c => c.Schedule1)
                .ThenInclude(s => s!.TimeSlot)
            .Include(c => c.Schedule2)
                .ThenInclude(s => s!.TimeSlot)
            .Include(c => c.TimeSlot)
            .Include(c => c.Communications)
                .ThenInclude(c => c.User)
            .Include(c => c.Reviews)
                .ThenInclude(r => r.Reviewer)
            .Include(c => c.AssignedToUser)
            .Include(c => c.ResolvedByUser)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    public async Task<IEnumerable<Conflict>> GetConflictsAsync(ConflictStatus? status = null, ConflictLevel? level = null, int? semesterId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Conflicts
            .Include(c => c.Classroom)
            .Include(c => c.Schedule1)
                .ThenInclude(s => s!.Course)
            .Include(c => c.Schedule2)
                .ThenInclude(s => s!.Course)
            .Include(c => c.TimeSlot)
            .AsQueryable();

        if (status.HasValue)
            query = query.Where(c => c.Status == status.Value);
        if (level.HasValue)
            query = query.Where(c => c.Level == level.Value);
        if (semesterId.HasValue)
        {
            query = query.Where(c =>
                (c.Schedule1 != null && c.Schedule1.SemesterId == semesterId.Value) ||
                (c.Schedule2 != null && c.Schedule2.SemesterId == semesterId.Value));
        }

        return await query
            .OrderByDescending(c => c.Level)
            .ThenBy(c => c.Status)
            .ThenByDescending(c => c.CreatedAt)
            .ToListAsync(cancellationToken);
    }
}
