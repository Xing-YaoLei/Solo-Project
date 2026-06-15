using Microsoft.EntityFrameworkCore;
using EduSchedule.API.Data;
using EduSchedule.API.Models;
using EduSchedule.API.Enums;

namespace EduSchedule.API.Services;

public class ClassroomService : IClassroomService
{
    private readonly AppDbContext _context;

    public ClassroomService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Classroom>> GetClassroomsAsync(RoomType? type = null, int? minCapacity = null, string? search = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Classrooms
            .Include(c => c.Schedules)
                .ThenInclude(s => s.Course)
            .AsQueryable();

        if (type.HasValue)
            query = query.Where(c => c.Type == type.Value);
        if (minCapacity.HasValue)
            query = query.Where(c => c.Capacity >= minCapacity.Value);
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(c => c.Name.Contains(search) || c.RoomNumber.Contains(search) || c.Building != null && c.Building.Contains(search));

        return await query
            .OrderBy(c => c.Building)
            .ThenBy(c => c.RoomNumber)
            .ToListAsync(cancellationToken);
    }

    public async Task<Classroom?> GetClassroomByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Classrooms
            .Include(c => c.Schedules)
                .ThenInclude(s => s.Course)
                    .ThenInclude(c => c.TeacherCourses)
                        .ThenInclude(tc => tc.Teacher)
            .Include(c => c.Schedules)
                .ThenInclude(s => s.TimeSlot)
            .Include(c => c.Conflicts)
                .ThenInclude(c => c.Schedule1)
                    .ThenInclude(s => s!.Course)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    public async Task<Classroom> CreateClassroomAsync(Classroom classroom, CancellationToken cancellationToken = default)
    {
        classroom.CreatedAt = DateTime.UtcNow;
        classroom.IsActive = true;

        _context.Classrooms.Add(classroom);
        await _context.SaveChangesAsync(cancellationToken);

        return classroom;
    }

    public async Task<Classroom> UpdateClassroomAsync(Classroom classroom, CancellationToken cancellationToken = default)
    {
        var existing = await _context.Classrooms.FindAsync(new object[] { classroom.Id }, cancellationToken);
        if (existing == null)
            throw new KeyNotFoundException($"Classroom with id {classroom.Id} not found");

        existing.RoomNumber = classroom.RoomNumber;
        existing.Name = classroom.Name;
        existing.Location = classroom.Location;
        existing.Type = classroom.Type;
        existing.Capacity = classroom.Capacity;
        existing.Equipment = classroom.Equipment;
        existing.Description = classroom.Description;
        existing.Floor = classroom.Floor;
        existing.Building = classroom.Building;
        existing.HasProjector = classroom.HasProjector;
        existing.HasWhiteboard = classroom.HasWhiteboard;
        existing.HasMicrophone = classroom.HasMicrophone;
        existing.HasSoundSystem = classroom.HasSoundSystem;
        existing.HasAirConditioning = classroom.HasAirConditioning;
        existing.IsDisabledAccessible = classroom.IsDisabledAccessible;
        existing.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return existing;
    }

    public async Task<bool> DeleteClassroomAsync(int id, CancellationToken cancellationToken = default)
    {
        var classroom = await _context.Classrooms.FindAsync(new object[] { id }, cancellationToken);
        if (classroom == null) return false;

        var hasSchedules = await _context.CourseSchedules.AnyAsync(s => s.ClassroomId == id, cancellationToken);
        if (hasSchedules)
            throw new InvalidOperationException("该教室已有排课记录，无法删除");

        _context.Classrooms.Remove(classroom);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<IEnumerable<Classroom>> GetAvailableClassroomsAsync(int semesterId, WeekDay dayOfWeek, int timeSlotId, int startWeek, int endWeek, RoomType? requiredType = null, int? minCapacity = null, CancellationToken cancellationToken = default)
    {
        var occupiedClassroomIds = await _context.CourseSchedules
            .Where(s => s.SemesterId == semesterId
                && s.DayOfWeek == dayOfWeek
                && s.TimeSlotId == timeSlotId
                && s.StartWeek <= endWeek
                && s.EndWeek >= startWeek
                && s.ApprovalStatus != ApprovalStatus.Rejected)
            .Select(s => s.ClassroomId)
            .Distinct()
            .ToListAsync(cancellationToken);

        var query = _context.Classrooms
            .Where(c => !occupiedClassroomIds.Contains(c.Id) && c.IsActive);

        if (requiredType.HasValue)
            query = query.Where(c => c.Type == requiredType.Value);
        if (minCapacity.HasValue)
            query = query.Where(c => c.Capacity >= minCapacity.Value);

        return await query
            .OrderBy(c => c.Capacity)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<ClassroomUsageDto>> GetClassroomUsageReportAsync(int semesterId, CancellationToken cancellationToken = default)
    {
        var timeSlots = await _context.TimeSlots.CountAsync(cancellationToken);
        var totalPossibleSlots = timeSlots * 5 * 16;

        var classrooms = await _context.Classrooms
            .Include(c => c.Schedules)
                .ThenInclude(s => s.TimeSlot)
            .Where(c => c.Schedules.Any(s => s.SemesterId == semesterId))
            .ToListAsync(cancellationToken);

        var report = new List<ClassroomUsageDto>();

        foreach (var classroom in classrooms)
        {
            var schedules = classroom.Schedules
                .Where(s => s.SemesterId == semesterId && s.ApprovalStatus == ApprovalStatus.Approved)
                .ToList();

            int usedSlots = schedules.Sum(s => (s.EndWeek - s.StartWeek + 1));

            report.Add(new ClassroomUsageDto
            {
                ClassroomId = classroom.Id,
                RoomNumber = classroom.RoomNumber,
                RoomName = classroom.Name,
                Building = classroom.Building,
                Capacity = classroom.Capacity,
                Type = classroom.Type,
                TotalSchedules = schedules.Count,
                UsedSlots = usedSlots,
                TotalPossibleSlots = totalPossibleSlots,
                UsageRate = totalPossibleSlots > 0 ? (double)usedSlots / totalPossibleSlots : 0
            });
        }

        return report.OrderByDescending(r => r.UsageRate);
    }
}

public class ClassroomUsageDto
{
    public int ClassroomId { get; set; }
    public string RoomNumber { get; set; } = string.Empty;
    public string RoomName { get; set; } = string.Empty;
    public string? Building { get; set; }
    public int Capacity { get; set; }
    public RoomType Type { get; set; }
    public int TotalSchedules { get; set; }
    public int UsedSlots { get; set; }
    public int TotalPossibleSlots { get; set; }
    public double UsageRate { get; set; }
}
